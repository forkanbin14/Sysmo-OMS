import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CallSignal } from '@/types/database';

interface UseWebRTCCallOptions {
  currentUserId: string | null;
  receiverId: string | null;
  conversationId: string | null;
  onSignalInsert: (signal: CallSignal) => void;
}

export type { CallSignal } from '@/types/database';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTCCall({ currentUserId, receiverId, conversationId, onSignalInsert }: UseWebRTCCallOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  const getPeer = useCallback(() => {
    if (!pcRef.current) {
      pcRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current.ontrack = (e) => {
        const stream = e.streams[0];
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      };
      pcRef.current.onicecandidate = (e) => {
        if (e.candidate && callIdRef.current) {
          supabase.from('call_signaling').insert({
            call_id: callIdRef.current,
            conversation_id: conversationId,
            sender_id: currentUserId,
            receiver_id: receiverId,
            type: 'ice-candidate',
            payload: { candidate: e.candidate.toJSON() },
          }).then();
        }
      };
      pcRef.current.onconnectionstatechange = () => {
        if (pcRef.current?.connectionState === 'failed') {
          pcRef.current.restartIce();
        }
      };
    }
    return pcRef.current;
  }, [conversationId, currentUserId, receiverId]);

  const callIdRef = useRef<string | null>(null);
  useEffect(() => { callIdRef.current = callId; }, [callId]);

  const startCall = useCallback(async (type: 'voice' | 'video') => {
    const id = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCallId(id);
    callIdRef.current = id;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = getPeer();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from('call_signaling').insert({
        call_id: id,
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        type: 'call-start',
        payload: { callType: type, offer: { type: offer.type, sdp: offer.sdp } },
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      throw err;
    }
  }, [conversationId, currentUserId, receiverId, getPeer]);

  const acceptCall = useCallback(async (signal: CallSignal) => {
    const id = signal.call_id;
    setCallId(id);
    callIdRef.current = id;

    const callType = (signal.payload?.callType as 'voice' | 'video') ?? 'voice';
    const offer = signal.payload?.offer as RTCSessionDescriptionInit;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = getPeer();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await supabase.from('call_signaling').insert({
        call_id: id,
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        type: 'answer',
        payload: { answer: { type: answer.type, sdp: answer.sdp } },
      });
    } catch (err) {
      console.error('Failed to accept call:', err);
      throw err;
    }
  }, [conversationId, currentUserId, receiverId, getPeer]);

  const handleSignal = useCallback(async (signal: CallSignal) => {
    const pc = getPeer();
    if (signal.type === 'answer' && signal.sender_id !== currentUserId) {
      const answer = signal.payload?.answer as RTCSessionDescriptionInit;
      if (answer) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } else if (signal.type === 'ice-candidate' && signal.sender_id !== currentUserId) {
      const candidate = signal.payload?.candidate as RTCIceCandidateInit;
      if (candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* ignore */ }
      }
    } else if (signal.type === 'call-rejected' && signal.receiver_id === currentUserId) {
      // handled by caller via onSignalInsert
    }
  }, [currentUserId, getPeer]);

  const endCall = useCallback(() => {
    if (callIdRef.current) {
      supabase.from('call_signaling').insert({
        call_id: callIdRef.current,
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        type: 'call-end',
        payload: {},
      }).then();
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallId(null);
    callIdRef.current = null;
  }, [conversationId, currentUserId, receiverId]);

  const rejectCall = useCallback(() => {
    if (callIdRef.current) {
      supabase.from('call_signaling').insert({
        call_id: callIdRef.current,
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: receiverId,
        type: 'call-rejected',
        payload: {},
      }).then();
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallId(null);
    callIdRef.current = null;
  }, [conversationId, currentUserId, receiverId]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
  }, []);

  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
  }, []);

  return {
    startCall,
    acceptCall,
    handleSignal,
    endCall,
    rejectCall,
    toggleMute,
    toggleVideo,
    localStream,
    remoteStream,
    callId,
  };
}

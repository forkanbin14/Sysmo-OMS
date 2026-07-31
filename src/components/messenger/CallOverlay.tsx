import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, Users } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import type { Employee } from '@/types/database';

export type CallType = 'voice' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'rejected';

interface CallOverlayProps {
  state: CallState;
  callType: CallType;
  otherUser: Employee | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  muted: boolean;
  videoEnabled: boolean;
  isIncoming: boolean;
}

export function CallOverlay({
  state,
  callType,
  otherUser,
  localStream,
  remoteStream,
  callDuration,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
  muted,
  videoEnabled,
  isIncoming,
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (state === 'idle') return null;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const statusText = {
    calling: isIncoming ? 'Incoming call…' : 'Calling…',
    ringing: 'Ringing…',
    connected: formatDuration(callDuration),
    ended: 'Call ended',
    rejected: 'Call rejected',
  }[state] ?? '';

  const showVideo = callType === 'video' && (state === 'connected' || state === 'calling' || state === 'ringing');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink-950/95 backdrop-blur-xl animate-fade-in">
      {/* Video area */}
      {showVideo && (
        <>
          {/* Remote video (full screen) */}
          {remoteStream && state === 'connected' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-ink-950 to-accent-600/20" />
              <Avatar
                name={otherUser?.name ?? 'Unknown'}
                src={otherUser?.avatar_url}
                size="xl"
                className="!h-32 !w-32 !text-4xl ring-4 ring-white/20"
              />
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          {localStream && videoEnabled && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute right-4 top-20 z-10 h-40 w-28 rounded-xl object-cover shadow-float sm:h-48 sm:w-32"
            />
          )}
        </>
      )}

      {/* Voice call: avatar + info */}
      {!showVideo && (
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar
              name={otherUser?.name ?? 'Unknown'}
              src={otherUser?.avatar_url}
              size="xl"
              className="!h-28 !w-28 !text-3xl ring-4 ring-white/20"
            />
            {state === 'connected' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-success-500 px-3 py-0.5 text-[10px] font-semibold text-white">
                Connected
              </span>
            )}
            {(state === 'calling' || state === 'ringing') && (
              <span className="absolute inset-0 animate-ring-ping rounded-full border-2 border-brand-400" />
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <div className={cn('z-10 mt-6 flex flex-col items-center', showVideo && 'absolute bottom-32')}>
        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
          {otherUser?.name ?? 'Unknown'}
        </h2>
        <p className="mt-1 text-sm text-ink-400">
          {callType === 'video' ? 'Video call' : 'Voice call'} · {statusText}
        </p>
      </div>

      {/* Controls */}
      <div className={cn('z-10 flex items-center gap-3', showVideo ? 'absolute bottom-8' : 'mt-8')}>
        {/* Incoming: Accept / Reject */}
        {isIncoming && state === 'calling' && (
          <>
            <button
              onClick={onReject}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-600 text-white shadow-glow transition-transform hover:scale-110 active:scale-95"
              aria-label="Reject call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <button
              onClick={onAccept}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-success-500 text-white shadow-glow transition-transform hover:scale-110 active:scale-95"
              aria-label="Accept call"
            >
              {callType === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </button>
          </>
        )}

        {/* Outgoing: Cancel */}
        {!isIncoming && (state === 'calling' || state === 'ringing') && (
          <button
            onClick={onReject}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-600 text-white shadow-glow transition-transform hover:scale-110 active:scale-95"
            aria-label="Cancel call"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        )}

        {/* Connected: Mute / Video / End */}
        {state === 'connected' && (
          <>
            <button
              onClick={onToggleMute}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95',
                muted ? 'bg-danger-600 text-white' : 'bg-white/10 text-white hover:bg-white/20',
              )}
              aria-label="Toggle mute"
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={onToggleVideo}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95',
                  !videoEnabled ? 'bg-danger-600 text-white' : 'bg-white/10 text-white hover:bg-white/20',
                )}
                aria-label="Toggle video"
              >
                {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
            )}

            <button
              onClick={onToggleVideo}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-transform hover:scale-110 hover:bg-white/20 active:scale-95"
              aria-label="Speaker"
            >
              <Volume2 className="h-5 w-5" />
            </button>

            <button
              onClick={onEnd}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-600 text-white shadow-glow transition-transform hover:scale-110 active:scale-95"
              aria-label="End call"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Ended/rejected: close */}
        {(state === 'ended' || state === 'rejected') && (
          <button
            onClick={onEnd}
            className="flex h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-white transition-colors hover:bg-white/20"
          >
            <PhoneOff className="h-5 w-5" /> Close
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

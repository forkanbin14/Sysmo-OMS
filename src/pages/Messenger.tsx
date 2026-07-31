import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send,
  Search,
  MessageSquare,
  Plus,
  ArrowLeft,
  CheckCheck,
  Phone,
  Video,
  Paperclip,
  FileText,
  Download,
  X,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Conversation } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ClickableAvatar, ClickableName } from '@/components/shared/ClickableUser';
import { CallOverlay, type CallState, type CallType } from '@/components/messenger/CallOverlay';
import { cn, formatTime, formatDate } from '@/lib/utils';

interface MessengerPageProps {
  data: AppData;
  initialTargetId?: string | null;
  onViewProfile?: (empId: string) => void;
  onClearTarget?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return formatDate(iso);
}

export function MessengerPage({ data, initialTargetId, onViewProfile, onClearTarget }: MessengerPageProps) {
  const { conversations, employees, refresh } = data;
  const toast = useToast();
  const { user: currentUser } = useCurrentUser();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('voice');
  const [callDuration, setCallDuration] = useState(0);
  const [isIncoming, setIsIncoming] = useState(false);
  const [incomingSignal, setIncomingSignal] = useState<import('@/types/database').CallSignal | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const currentUserId = currentUser?.id ?? '';

  const activeConv = conversations.find((c) => c.id === activeId);
  const otherMember = activeConv?.members?.find((m) => m.employee_id !== currentUserId)?.employee ?? null;

  const {
    startCall: rtcStartCall,
    acceptCall: rtcAcceptCall,
    handleSignal: rtcHandleSignal,
    endCall: rtcEndCall,
    rejectCall: rtcRejectCall,
    toggleMute: rtcToggleMute,
    toggleVideo: rtcToggleVideo,
    localStream,
    remoteStream,
    callId,
  } = useWebRTCCall({
    currentUserId: currentUserId || null,
    receiverId: otherMember?.id ?? null,
    conversationId: activeConv?.id ?? null,
    onSignalInsert: () => {},
  });

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aLast = a.messages && a.messages.length > 0 ? a.messages[a.messages.length - 1].created_at : a.created_at;
      const bLast = b.messages && b.messages.length > 0 ? b.messages[b.messages.length - 1].created_at : b.created_at;
      return bLast.localeCompare(aLast);
    });
  }, [conversations]);

  function getOtherMember(conv: Conversation) {
    return conv.members?.find((m) => m.employee_id !== currentUserId)?.employee ?? null;
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeConv) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeConv?.messages?.length, activeId]);

  // Start conversation from initialTargetId (e.g., from profile "Message" button)
  useEffect(() => {
    if (initialTargetId && currentUser) {
      const existing = conversations.find((c) =>
        c.members?.some((m) => m.employee_id === initialTargetId) &&
        c.members?.some((m) => m.employee_id === currentUserId) &&
        (c.members?.length ?? 0) === 2,
      );
      if (existing) {
        setActiveId(existing.id);
        onClearTarget?.();
      } else {
        startConversationWith(initialTargetId);
      }
    }
  }, [initialTargetId, conversations, currentUser]);

  // Call duration timer
  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Listen for incoming call signals
  useEffect(() => {
    if (!currentUserId || !activeConv) return;
    const channel = supabase
      .channel(`call-signaling-${currentUserId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'call_signaling', filter: `receiver_id=eq.${currentUserId}` },
        (payload) => {
          const signal = payload.new as import('@/types/database').CallSignal;
          if (signal.type === 'call-start') {
            setIsIncoming(true);
            setIncomingSignal(signal);
            setCallState('calling');
            const ct = (signal.payload?.callType as CallType) ?? 'voice';
            setCallType(ct);
          } else if (signal.type === 'answer') {
            setCallState('connected');
            setCallDuration(0);
            rtcHandleSignal(signal);
          } else if (signal.type === 'ice-candidate') {
            rtcHandleSignal(signal);
          } else if (signal.type === 'call-end' || signal.type === 'call-rejected') {
            setCallState(signal.type === 'call-rejected' ? 'rejected' : 'ended');
            rtcEndCall();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, activeConv, rtcHandleSignal, rtcEndCall]);

  async function sendMessage() {
    if (!message.trim() || !activeConv) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: currentUserId,
      content: message.trim(),
      message_type: 'text',
    });
    setSending(false);
    if (error) {
      toast.error('Could not send message', error.message);
      return;
    }
    setMessage('');
    refresh();
  }

  async function uploadFile(file: File) {
    if (!activeConv) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `messages/${activeConv.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('chat-files').upload(path, file);
    if (upErr) {
      toast.error('File upload failed', upErr.message);
      setUploading(false);
      return;
    }
    const url = supabase.storage.from('chat-files').getPublicUrl(path).data.publicUrl;
    const { error: msgErr } = await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: currentUserId,
      content: file.name,
      message_type: 'file',
      file_url: url,
      file_name: file.name,
      file_size: file.size,
    });
    setUploading(false);
    if (msgErr) {
      toast.error('Could not send file', msgErr.message);
      return;
    }
    toast.success('File sent');
    refresh();
  }

  async function startConversationWith(empId: string) {
    const existing = conversations.find((c) =>
      c.members?.some((m) => m.employee_id === empId) &&
      c.members?.some((m) => m.employee_id === currentUserId) &&
      (c.members?.length ?? 0) === 2,
    );
    if (existing) {
      setActiveId(existing.id);
      onClearTarget?.();
      return;
    }
    const { data: conv, error } = await supabase.from('conversations').insert({}).select().single();
    if (error || !conv) {
      toast.error('Could not start conversation', error?.message);
      return;
    }
    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, employee_id: currentUserId },
      { conversation_id: conv.id, employee_id: empId },
    ]);
    toast.success('Conversation started');
    onClearTarget?.();
    refresh();
    setTimeout(() => setActiveId(conv.id), 300);
  }

  async function handleStartCall(type: CallType) {
    if (!activeConv || !otherMember) return;
    setCallType(type);
    setIsIncoming(false);
    setCallState('calling');
    setMuted(false);
    setVideoEnabled(type === 'video');
    try {
      await rtcStartCall(type);
    } catch {
      toast.error('Could not access camera/microphone', 'Please allow permissions and try again.');
      setCallState('idle');
    }
  }

  async function handleAcceptCall() {
    if (!incomingSignal) return;
    setCallState('connected');
    setCallDuration(0);
    try {
      await rtcAcceptCall(incomingSignal);
    } catch {
      toast.error('Could not accept call', 'Please allow permissions and try again.');
      setCallState('idle');
    }
  }

  function handleRejectCall() {
    rtcRejectCall();
    setCallState('rejected');
  }

  function handleEndCall() {
    rtcEndCall();
    setCallState('ended');
    setCallDuration(0);
  }

  function handleToggleMute() {
    rtcToggleMute();
    setMuted((m) => !m);
  }

  function handleToggleVideo() {
    rtcToggleVideo();
    setVideoEnabled((v) => !v);
  }

  const filteredEmployees = employees.filter((e) =>
    e.id !== currentUserId &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()) ||
     (e.position ?? '').toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="Messenger"
        description="Direct messages, voice & video calls with your team"
        actions={
          <Button onClick={() => setNewChatOpen(true)}>
            <Plus className="h-4 w-4" /> New chat
          </Button>
        }
      />

      <Card className="overflow-hidden p-0 dark:bg-ink-850/60 dark:border-white/[0.06]">
        <div className="flex h-[calc(100vh-220px)] min-h-[420px]">
          {/* Conversation list */}
          <div className={cn(
            'flex flex-col border-r border-ink-100 dark:border-white/[0.06]',
            activeId ? 'hidden w-full md:flex md:w-72 lg:w-80' : 'w-full md:w-72 lg:w-80',
          )}>
            <div className="border-b border-ink-100 p-3 dark:border-white/[0.06]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="input-base h-9 pl-9 text-[13px]"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sortedConversations.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <div>
                    <MessageSquare className="mx-auto h-8 w-8 text-ink-300 dark:text-ink-600" />
                    <p className="mt-2 text-[13px] text-ink-500 dark:text-ink-400">No conversations yet</p>
                  </div>
                </div>
              ) : (
                sortedConversations.map((conv) => {
                  const other = getOtherMember(conv);
                  const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
                  const active = conv.id === activeId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveId(conv.id)}
                      className={cn(
                        'flex w-full items-center gap-3 border-b border-ink-50 p-3 text-left transition-colors dark:border-white/[0.03]',
                        active ? 'bg-brand-500/10' : 'hover:bg-ink-50 dark:hover:bg-white/[0.02]',
                      )}
                    >
                      <Avatar name={other?.name ?? 'Unknown'} src={other?.avatar_url} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">{other?.name}</p>
                          {lastMsg && <span className="shrink-0 text-[10px] text-ink-400">{timeAgo(lastMsg.created_at)}</span>}
                        </div>
                        <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                          {lastMsg?.sender_id === currentUserId ? 'You: ' : ''}
                          {lastMsg?.message_type === 'file' ? '📎 ' + lastMsg.file_name : lastMsg?.content ?? 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat thread */}
          <div className={cn('flex flex-1 flex-col', !activeId && 'hidden md:flex')}>
            {activeConv && otherMember ? (
              <>
                {/* Header with call buttons */}
                <div className="flex items-center gap-3 border-b border-ink-100 p-3 dark:border-white/[0.06]">
                  <button
                    onClick={() => setActiveId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 md:hidden dark:hover:bg-white/5"
                  >
                    <ArrowLeft className="h-4.5 w-4.5" />
                  </button>
                  <ClickableAvatar employee={otherMember} name={otherMember.name} src={otherMember.avatar_url} size="sm" onViewProfile={onViewProfile} />
                  <div className="min-w-0 flex-1">
                    <ClickableName employee={otherMember} name={otherMember.name} onViewProfile={onViewProfile} className="truncate text-[14px]" />
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{otherMember.position}</p>
                  </div>
                  {/* Call buttons */}
                  <button
                    onClick={() => handleStartCall('voice')}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-success-50 hover:text-success-600 dark:hover:bg-success-500/10 dark:hover:text-success-400"
                    aria-label="Voice call"
                  >
                    <Phone className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => handleStartCall('video')}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                    aria-label="Video call"
                  >
                    <Video className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {activeConv.messages?.map((msg) => {
                    const mine = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div className={cn('flex max-w-[75%] items-end gap-2', mine && 'flex-row-reverse')}>
                          {!mine && <Avatar name={msg.sender?.name ?? otherMember.name} src={msg.sender?.avatar_url} size="xs" />}
                          <div>
                            {msg.message_type === 'file' && msg.file_url ? (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  'flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[13px] transition-colors',
                                  mine
                                    ? 'rounded-br-md bg-brand-600 text-white'
                                    : 'rounded-bl-md bg-ink-100 text-ink-800 dark:bg-white/[0.06] dark:text-ink-200',
                                )}
                              >
                                <span className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                  mine ? 'bg-white/20' : 'bg-brand-500/10 text-brand-500',
                                )}>
                                  <FileText className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{msg.file_name}</p>
                                  <p className={cn('text-[10px]', mine ? 'text-white/70' : 'text-ink-400')}>
                                    {msg.file_size ? `${(msg.file_size / 1024).toFixed(0)} KB` : ''}
                                  </p>
                                </div>
                                <Download className={cn('h-4 w-4 shrink-0', mine ? 'text-white/70' : 'text-ink-400')} />
                              </a>
                            ) : (
                              <div className={cn(
                                'rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed',
                                mine
                                  ? 'rounded-br-md bg-brand-600 text-white'
                                  : 'rounded-bl-md bg-ink-100 text-ink-800 dark:bg-white/[0.06] dark:text-ink-200',
                              )}>
                                {msg.content}
                              </div>
                            )}
                            <p className={cn('mt-0.5 flex items-center gap-1 text-[10px] text-ink-400', mine ? 'justify-end' : 'justify-start')}>
                              {formatTime(msg.created_at)}
                              {mine && <CheckCheck className="h-3 w-3 text-brand-500" />}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>

                {/* Input bar */}
                <div className="flex items-center gap-2 border-t border-ink-100 p-3 dark:border-white/[0.06]">
                  <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-white/5 dark:hover:text-brand-400">
                    {uploading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-brand-500" />
                    ) : (
                      <Paperclip className="h-4.5 w-4.5" />
                    )}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                    />
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message…"
                    className="input-base h-11 flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    loading={sending}
                    disabled={!message.trim()}
                    className="h-11 w-11"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-center">
                <div>
                  <MessageSquare className="mx-auto h-10 w-10 text-ink-300 dark:text-ink-600" />
                  <p className="mt-2 text-[13px] font-medium text-ink-500 dark:text-ink-400">Select a conversation</p>
                  <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">Or start a new chat with a teammate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* New chat modal */}
      <Modal
        open={newChatOpen}
        onClose={() => { setNewChatOpen(false); setSelectedEmp(null); }}
        title="Start a new chat"
        description="Pick a teammate to message"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setNewChatOpen(false); setSelectedEmp(null); }}>Cancel</Button>
            <Button onClick={() => selectedEmp && startConversationWith(selectedEmp)} disabled={!selectedEmp}>Start chat</Button>
          </>
        }
      >
        <div className="space-y-1.5">
          {filteredEmployees.map((emp) => {
            const active = emp.id === selectedEmp;
            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmp(emp.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors',
                  active ? 'bg-brand-500/10 ring-1 ring-inset ring-brand-500/20' : 'hover:bg-ink-50 dark:hover:bg-white/[0.03]',
                )}
              >
                <Avatar name={emp.name} src={emp.avatar_url} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">{emp.name}</p>
                  <p className="truncate text-xs text-ink-500 dark:text-ink-400">{emp.position}</p>
                </div>
                {active && <CheckCheck className="h-4 w-4 text-brand-500" />}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Call overlay */}
      <CallOverlay
        state={callState}
        callType={callType}
        otherUser={otherMember}
        localStream={localStream}
        remoteStream={remoteStream}
        callDuration={callDuration}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        muted={muted}
        videoEnabled={videoEnabled}
        isIncoming={isIncoming}
      />
    </div>
  );
}

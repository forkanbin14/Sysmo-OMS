import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send,
  Search,
  MessageSquare,
  Plus,
  ArrowLeft,
  CheckCheck,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Conversation } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn, formatTime, formatDate } from '@/lib/utils';

interface MessengerPageProps {
  data: AppData;
}

const CURRENT_USER_ID = '22222222-2222-2222-2222-222222222201';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return formatDate(iso);
}

export function MessengerPage({ data }: MessengerPageProps) {
  const { conversations, employees, refresh } = data;
  const toast = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId);
  const currentUser = employees.find((e) => e.id === CURRENT_USER_ID) ?? employees[0];

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aLast = a.messages && a.messages.length > 0 ? a.messages[a.messages.length - 1].created_at : a.created_at;
      const bLast = b.messages && b.messages.length > 0 ? b.messages[b.messages.length - 1].created_at : b.created_at;
      return bLast.localeCompare(aLast);
    });
  }, [conversations]);

  function getOtherMember(conv: Conversation) {
    return conv.members?.find((m) => m.employee_id !== CURRENT_USER_ID)?.employee ?? null;
  }

  useEffect(() => {
    if (activeConv) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeConv?.messages?.length, activeId]);

  async function sendMessage() {
    if (!message.trim() || !activeConv) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: CURRENT_USER_ID,
      content: message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error('Could not send message', error.message);
      return;
    }
    setMessage('');
    refresh();
  }

  async function startConversation() {
    if (!selectedEmp) return;
    const existing = conversations.find((c) =>
      c.members?.some((m) => m.employee_id === selectedEmp) &&
      c.members?.some((m) => m.employee_id === CURRENT_USER_ID) &&
      (c.members?.length ?? 0) === 2,
    );
    if (existing) {
      setActiveId(existing.id);
      setNewChatOpen(false);
      setSelectedEmp(null);
      return;
    }
    const { data: conv, error } = await supabase.from('conversations').insert({}).select().single();
    if (error || !conv) {
      toast.error('Could not start conversation', error?.message);
      return;
    }
    const { error: mErr } = await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, employee_id: CURRENT_USER_ID },
      { conversation_id: conv.id, employee_id: selectedEmp },
    ]);
    if (mErr) {
      toast.error('Could not add members', mErr.message);
      return;
    }
    toast.success('Conversation started');
    setNewChatOpen(false);
    setSelectedEmp(null);
    refresh();
    setTimeout(() => setActiveId(conv.id), 300);
  }

  const filteredEmployees = employees.filter((e) =>
    e.id !== CURRENT_USER_ID &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()) ||
     (e.position ?? '').toLowerCase().includes(search.toLowerCase())),
  );

  const otherMember = activeConv ? getOtherMember(activeConv) : null;

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="Messenger"
        description="Direct messages with your team"
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
                          {lastMsg?.sender_id === CURRENT_USER_ID ? 'You: ' : ''}
                          {lastMsg?.content ?? 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat thread */}
          <div className={cn(
            'flex flex-1 flex-col',
            !activeId && 'hidden md:flex',
          )}>
            {activeConv && otherMember ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-ink-100 p-3 dark:border-white/[0.06]">
                  <button
                    onClick={() => setActiveId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 md:hidden dark:hover:bg-white/5"
                  >
                    <ArrowLeft className="h-4.5 w-4.5" />
                  </button>
                  <Avatar name={otherMember.name} src={otherMember.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink-900 dark:text-white">{otherMember.name}</p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{otherMember.position}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-success-600 dark:text-success-400">
                    <span className="h-2 w-2 rounded-full bg-success-500" /> Online
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {activeConv.messages?.map((msg) => {
                    const mine = msg.sender_id === CURRENT_USER_ID;
                    return (
                      <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div className={cn('flex max-w-[75%] items-end gap-2', mine && 'flex-row-reverse')}>
                          {!mine && <Avatar name={msg.sender?.name ?? otherMember.name} src={msg.sender?.avatar_url} size="xs" />}
                          <div>
                            <div className={cn(
                              'rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed',
                              mine
                                ? 'rounded-br-md bg-brand-600 text-white'
                                : 'rounded-bl-md bg-ink-100 text-ink-800 dark:bg-white/[0.06] dark:text-ink-200',
                            )}>
                              {msg.content}
                            </div>
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

                {/* Input */}
                <div className="flex items-center gap-2 border-t border-ink-100 p-3 dark:border-white/[0.06]">
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
            <Button onClick={startConversation} disabled={!selectedEmp}>Start chat</Button>
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
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  TrendingUp,
  Users,
  AlertCircle,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  { icon: TrendingUp, label: 'Summarize team performance this week' },
  { icon: Users,     label: 'Which employees are underutilized?' },
  { icon: AlertCircle, label: 'What tasks are at risk of being overdue?' },
  { icon: CalendarCheck, label: 'Who is available for a meeting today?' },
];

// Canned AI responses (rule-based, no external API)
const RESPONSES: Record<string, string> = {
  'summarize team performance':
    'Here is this week\u2019s snapshot:\n\n\u2022 8 active employees out of 10 \u2014 80% utilization\n\u2022 6 of 8 tasks are on track, 2 are approaching their due dates\n\u2022 Attendance is strong at 94%, with only 1 late check-in this week\n\u2022 Engineering and Sales are leading on project progress\n\nWould you like me to draft a summary email for stakeholders?',
  'underutilized':
    'Based on task assignments, these employees have no open tasks and could take on more work:\n\n\u2022 Michael Brown (Account Manager) \u2014 on leave, returning soon\n\u2022 Ryan Garcia (DevOps Engineer) \u2014 1 task in backlog, currently inactive\n\nI can reassign a task or schedule a 1:1 to discuss bandwidth.',
  'at risk':
    '2 tasks are at risk of being overdue:\n\n\u2022 "Map legacy CRM fields" \u2014 due in 2 days, still in review, assigned to Olivia Williams\n\u2022 "Build auth API endpoints" \u2014 due in 5 days, in progress, assigned to Sarah Chen\n\nRecommend checking in with both assignees. Want me to set up reminders?',
  'available for a meeting':
    'Right now, 7 of 8 active employees are marked present today. The best meeting windows are:\n\n\u2022 Today 2:00 PM \u2014 most team members have no scheduled meetings\n\u2022 Tomorrow 9:30 AM \u2014 right after the Engineering standup\n\nShall I create a calendar invite?',
};

function generateResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, value] of Object.entries(RESPONSES)) {
    if (lower.includes(key) || lower.includes(key.split(' ')[0])) {
      return value;
    }
  }
  return 'I can help you analyze your team\u2019s performance, identify at-risk tasks, find available employees for meetings, and summarize key metrics. Try asking about team performance, task risks, or availability \u2014 or use one of the suggestions above.';
}

let nextId = 0;

export function AIAssistant({ open, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'Hi Alex \u2014 I\u2019m Atlas AI, your workspace assistant. I can analyze your team data, surface insights, and help you make decisions. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = { id: ++nextId, role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const reply: Message = { id: ++nextId, role: 'assistant', text: generateResponse(trimmed) };
      setMessages((m) => [...m, reply]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-ink-900/95 shadow-dark-float backdrop-blur-2xl animate-slide-in-right">
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="pointer-events-none absolute -left-12 top-0 h-32 w-32 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-white">Atlas AI</p>
              <p className="flex items-center gap-1.5 text-xs text-ink-400">
                <span className="h-1.5 w-1.5 rounded-full bg-success-400 animate-pulse-soft" />
                Online · Ready to help
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex animate-fade-in',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role === 'assistant' && (
                <div className="mr-2.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 shadow-soft">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm',
                  msg.role === 'user'
                    ? 'rounded-br-md bg-brand-600 font-medium text-white shadow-soft'
                    : 'rounded-bl-md border border-white/[0.06] bg-white/[0.03] text-ink-100',
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex animate-fade-in">
              <div className="mr-2.5 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 shadow-soft">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="space-y-2 px-5 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Try asking</p>
            {SUGGESTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => send(s.label)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 text-left text-sm text-ink-200 transition-all hover:border-brand-500/30 hover:bg-brand-500/10 hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400 transition-colors group-hover:bg-brand-500/25">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1">{s.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink-500 transition-all group-hover:translate-x-0.5 group-hover:text-brand-400" />
                </button>
              );
            })}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-end gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 transition-colors focus-within:border-brand-500/30 focus-within:bg-white/[0.05]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask Atlas anything…"
              rows={1}
              className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-ink-500 focus:outline-none"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all',
                input.trim() && !typing
                  ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow hover:scale-105 active:scale-95'
                  : 'bg-white/5 text-ink-500',
              )}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-500">
            Atlas AI can analyze your workspace data and provide insights.
          </p>
        </div>
      </div>
    </>
  );
}

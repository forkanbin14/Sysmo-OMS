import { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Command,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobile: () => void;
  onSearch: () => void;
  onOpenProfile: () => void;
  onOpenAI?: () => void;
}

export function Topbar({ title, subtitle, onOpenMobile, onSearch, onOpenProfile, onOpenAI }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen && !notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen, notifOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDropdownOpen(false); setNotifOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const notifications = [
    { title: 'Sarah Chen completed "Build auth API"', time: '2m ago', tone: 'success' as const },
    { title: 'Q4 Campaign Kickoff starts in 1 hour', time: '45m ago', tone: 'warning' as const },
    { title: 'New employee Ava Thompson joined Marketing', time: '3h ago', tone: 'brand' as const },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-ink-925/70 backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu toggle */}
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile search icon */}
        <button
          onClick={onSearch}
          className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Page title */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold text-white sm:text-xl">{title}</h1>
          {subtitle && (
            <p className="hidden truncate text-sm text-ink-400 sm:block">{subtitle}</p>
          )}
        </div>

        {/* AI assistant button */}
        {onOpenAI && (
          <button
            onClick={onOpenAI}
            className="group relative hidden items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600/20 to-accent-600/20 px-3.5 py-2 text-sm font-semibold text-brand-300 ring-1 ring-inset ring-brand-500/20 transition-all hover:from-brand-600/30 hover:to-accent-600/30 hover:ring-brand-500/40 md:flex"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <Sparkles className="h-4 w-4" />
            <span>Ask Atlas AI</span>
          </button>
        )}

        {/* Desktop search bar */}
        <button
          onClick={onSearch}
          className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-ink-400 transition-colors hover:border-white/[0.10] hover:text-ink-200 md:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search…</span>
          <kbd className="ml-2 inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-semibold text-ink-400">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-xl p-2.5 text-ink-300 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ring-ping rounded-full bg-brand-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850/95 shadow-dark-float backdrop-blur-2xl animate-fade-in-scale">
              <div className="border-b border-white/[0.06] px-4 py-3">
                <p className="font-display text-sm font-semibold text-white">Notifications</p>
              </div>
              <div className="max-h-80 divide-y divide-white/[0.04] overflow-y-auto">
                {notifications.map((n, i) => (
                  <button key={i} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]">
                    <span className={cn(
                      'mt-1 h-2 w-2 shrink-0 rounded-full',
                      n.tone === 'success' && 'bg-success-400',
                      n.tone === 'warning' && 'bg-warning-400',
                      n.tone === 'brand' && 'bg-brand-400',
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-100">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{n.time}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-white/[0.06] px-4 py-2.5">
                <button className="text-xs font-semibold text-brand-400 hover:text-brand-300">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile button + dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition-all duration-200',
              dropdownOpen
                ? 'border-brand-500/30 bg-brand-500/10 shadow-dark-glow'
                : 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.10] hover:bg-white/[0.05]',
            )}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <Avatar name="Alex Rivera" size="sm" ring />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold text-white">Alex Rivera</p>
              <p className="text-xs text-ink-400">Administrator</p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-3.5 w-3.5 text-ink-400 transition-transform duration-200 sm:block',
                dropdownOpen && 'rotate-180',
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850/95 shadow-dark-float backdrop-blur-2xl animate-fade-in-scale">
              <div className="flex items-center gap-3 border-b border-white/[0.06] bg-gradient-to-r from-brand-500/10 to-accent-500/10 px-4 py-3.5">
                <Avatar name="Alex Rivera" size="md" ring />
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-white">Alex Rivera</p>
                  <p className="truncate text-xs text-ink-400">alex.rivera@office.co</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-danger-500/15 px-2 py-0.5 text-[10px] font-semibold text-danger-400 ring-1 ring-inset ring-danger-500/20">
                    <Shield className="h-2.5 w-2.5" /> Admin
                  </span>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { setDropdownOpen(false); onOpenProfile(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:bg-brand-500/10 hover:text-brand-300"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  View full profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); onOpenProfile(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:bg-white/5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-ink-300">
                    <Settings className="h-3.5 w-3.5" />
                  </span>
                  Settings
                </button>
                {onOpenAI && (
                  <button
                    onClick={() => { setDropdownOpen(false); onOpenAI(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-200 transition-colors hover:bg-accent-500/10 hover:text-accent-300"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    Ask Atlas AI
                    <kbd className="ml-auto rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">⌘J</kbd>
                  </button>
                )}
              </div>
              <div className="border-t border-white/[0.06] p-1.5">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-400 transition-colors hover:bg-danger-500/10">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-danger-500/15 text-danger-400">
                    <LogOut className="h-3.5 w-3.5" />
                  </span>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

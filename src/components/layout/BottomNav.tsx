import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  MoreHorizontal,
  Bell,
  Settings,
  Shield,
  CalendarClock,
  Building2,
  CalendarCheck,
  Sparkles,
  Search,
  X,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageKey } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenMore: () => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  notificationCount?: number;
}

const primaryItems: { key: PageKey; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'employees', label: 'People', icon: Users },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
];

export function BottomNav({ current, onNavigate, onOpenMore }: BottomNavProps) {
  const moreActive = current === 'attendance' || current === 'meetings' || current === 'departments' || current === 'admin' || current === 'settings';

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      role="navigation"
      aria-label="Primary"
    >
      {/* Frosted glass bar with safe-area padding */}
      <div className="border-t border-white/[0.06] bg-ink-925/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
          {primaryItems.map((item) => {
            const active = current === item.key;
            const Icon = item.icon;
            return (
              <NavButton
                key={item.key}
                label={item.label}
                icon={Icon}
                active={active}
                onClick={() => onNavigate(item.key)}
              />
            );
          })}

          {/* More button */}
          <button
            onClick={onOpenMore}
            className="group relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
            aria-label="More navigation"
            aria-expanded={moreActive}
          >
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ease-out-quart',
                moreActive
                  ? 'bg-brand-500/15 text-brand-400 scale-105'
                  : 'text-ink-500 group-active:scale-95',
              )}
            >
              <MoreHorizontal className="h-[22px] w-[22px]" />
            </span>
            <span className={cn('text-[10px] font-medium transition-colors', moreActive ? 'text-white' : 'text-ink-500')}>
              More
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ease-out-quart',
          active
            ? 'bg-brand-500/15 text-brand-400 scale-105'
            : 'text-ink-500 group-active:scale-90 group-active:text-ink-300',
        )}
      >
        <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={cn('text-[10px] font-medium transition-colors', active ? 'text-white' : 'text-ink-500')}>
        {label}
      </span>
    </button>
  );
}

/* ── More sheet (secondary navigation) ── */

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
}

const secondaryItems: { key: PageKey; label: string; icon: LucideIcon; desc: string; badge?: string }[] = [
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck, desc: 'Check-ins & presence' },
  { key: 'meetings', label: 'Meetings', icon: CalendarClock, desc: 'Scheduled sessions' },
  { key: 'departments', label: 'Departments', icon: Building2, desc: 'Org structure' },
  { key: 'admin', label: 'Admin Panel', icon: Shield, desc: 'Roles & system', badge: 'Admin' },
  { key: 'settings', label: 'Settings', icon: Settings, desc: 'Account & preferences' },
];

export function MoreSheet({ open, onClose, current, onNavigate, onOpenSearch, onOpenAI }: MoreSheetProps) {
  if (!open) return null;

  function go(page: PageKey) {
    onNavigate(page);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:hidden">
      <div
        className="absolute inset-0 bg-ink-950/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl border-t border-white/[0.08] bg-ink-900/95 backdrop-blur-2xl animate-slide-in-up"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Quick actions row */}
        <div className="px-4 pt-2 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <QuickAction icon={Search} label="Search" onClick={() => { onClose(); onOpenSearch(); }} />
            <QuickAction icon={Sparkles} label="AI Assistant" onClick={() => { onClose(); onOpenAI(); }} highlight />
            <QuickAction icon={Bell} label="Alerts" onClick={onClose} badge={3} />
          </div>
        </div>

        {/* Section label */}
        <p className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-ink-600">
          All pages
        </p>

        {/* Navigation list */}
        <div className="px-3 pb-6 space-y-1">
          {secondaryItems.map((item) => {
            const active = current === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={cn(
                  'flex w-full items-center gap-3.5 rounded-xl px-3 py-3 transition-all duration-150 ease-out-quart active:scale-[0.98]',
                  active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset',
                    active
                      ? 'bg-brand-500/10 text-brand-400 ring-brand-500/20'
                      : 'bg-white/[0.04] text-ink-400 ring-white/[0.06]',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-ink-500">{item.desc}</p>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-danger-500/15 px-2 py-0.5 text-[10px] font-semibold text-danger-400 ring-1 ring-inset ring-danger-500/20">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-ink-600" />
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  highlight,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-150 active:scale-95"
      style={{ minHeight: 72 }}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          highlight
            ? 'bg-gradient-to-br from-brand-400 to-accent-500 text-white shadow-brand-glow'
            : 'bg-white/[0.05] text-ink-300 ring-1 ring-inset ring-white/[0.06]',
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="text-[11px] font-medium text-ink-400">{label}</span>
      {badge && (
        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export function useMoreSheet() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

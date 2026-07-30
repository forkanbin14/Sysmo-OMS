import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  CalendarCheck,
  CalendarClock,
  Shield,
  X,
  Sparkles,
  Settings,
  Newspaper,
  MessageSquare,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageKey =
  | 'dashboard'
  | 'employees'
  | 'departments'
  | 'projects'
  | 'tasks'
  | 'attendance'
  | 'meetings'
  | 'admin'
  | 'settings'
  | 'profile'
  | 'feed'
  | 'messenger';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const nav: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'feed',        label: 'Feed',         icon: Newspaper },
  { key: 'messenger',   label: 'Messenger',    icon: MessageSquare },
  { key: 'employees',   label: 'Employees',    icon: Users },
  { key: 'departments', label: 'Departments',  icon: Building2 },
  { key: 'projects',    label: 'Projects',     icon: FolderKanban },
  { key: 'tasks',       label: 'Tasks',        icon: CheckSquare },
  { key: 'attendance',  label: 'Attendance',   icon: CalendarCheck },
  { key: 'meetings',    label: 'Meetings',     icon: CalendarClock },
];

const socialNav: NavItem[] = [
  { key: 'profile', label: 'Profile', icon: UserCircle },
];

const adminNav: NavItem[] = [
  { key: 'admin',    label: 'Admin Panel', icon: Shield,   badge: 'Admin' },
  { key: 'settings', label: 'Settings',    icon: Settings },
];

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ current, onNavigate, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-md lg:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-ink-925 text-ink-100 transition-transform duration-300 ease-out-quart lg:translate-x-0',
          'border-r border-white/[0.04]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Ambient glow — subtle, premium */}
        <div className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-brand-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-28 w-28 rounded-full bg-accent-600/8 blur-3xl" />

        {/* Brand */}
        <div className="relative flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 shadow-brand-glow">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="font-display text-[15px] font-bold tracking-tight text-white">Atlas</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-ink-500">OS</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 pt-2 scrollbar-none">
          <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-widest text-ink-600">
            Workspace
          </p>
          {nav.map((item) => {
            const active = current === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ease-out-quart',
                  active ? 'bg-white/[0.06] text-white' : 'text-ink-400 hover:bg-white/[0.03] hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 -translate-y-1/2 w-0.5 rounded-r-full bg-brand-400" />
                )}
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    active ? 'text-brand-400' : 'text-ink-500 group-hover:text-ink-300',
                  )}
                />
                {item.label}
              </button>
            );
          })}

          {/* Social section */}
          <div className="pt-3">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-600">
              Social
            </p>
            {socialNav.map((item) => {
              const active = current === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ease-out-quart',
                    active ? 'bg-white/[0.06] text-white' : 'text-ink-400 hover:bg-white/[0.03] hover:text-white',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 -translate-y-1/2 w-0.5 rounded-r-full bg-accent-400" />
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-accent-400' : 'text-ink-500 group-hover:text-ink-300',
                    )}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Admin section */}
          <div className="pt-5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-600">
              Administration
            </p>
            {adminNav.map((item) => {
              const active = current === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ease-out-quart',
                    active ? 'bg-white/[0.06] text-white' : 'text-ink-400 hover:bg-white/[0.03] hover:text-white',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 -translate-y-1/2 w-0.5 rounded-r-full bg-danger-400" />
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-danger-400' : 'text-ink-500 group-hover:text-ink-300',
                    )}
                  />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-danger-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-danger-400 ring-1 ring-inset ring-danger-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer AI card — compact, Notion-style */}
        <div className="relative p-3">
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-brand-600/10 via-transparent to-transparent p-3">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-brand-500/15 blur-2xl animate-glow-pulse" />
            <div className="relative flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-accent-500">
                <Sparkles className="h-3 w-3 text-white" />
              </span>
              <p className="text-[13px] font-semibold text-white">Atlas AI</p>
            </div>
            <p className="relative mt-1.5 text-[11px] leading-relaxed text-ink-500">
              Insights, summaries and automations for your workspace.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export function useMobileNav() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

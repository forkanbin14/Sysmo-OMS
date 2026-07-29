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
  | 'settings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
  badge?: string;
}

const nav: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard, description: 'Overview & insights' },
  { key: 'employees',   label: 'Employees',   icon: Users,           description: 'Manage your team' },
  { key: 'departments', label: 'Departments', icon: Building2,       description: 'Org structure' },
  { key: 'projects',    label: 'Projects',    icon: FolderKanban,    description: 'Initiatives & timelines' },
  { key: 'tasks',       label: 'Tasks',       icon: CheckSquare,     description: 'Work items & progress' },
  { key: 'attendance',  label: 'Attendance',  icon: CalendarCheck,   description: 'Daily check-ins' },
  { key: 'meetings',    label: 'Meetings',    icon: CalendarClock,   description: 'Scheduled sessions' },
];

const adminNav: NavItem[] = [
  { key: 'admin',    label: 'Admin Panel', icon: Shield,   description: 'Roles, transactions & controls', badge: 'Admin' },
  { key: 'settings', label: 'Settings',    icon: Settings, description: 'Workspace preferences' },
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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-md lg:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink-925 text-ink-100 transition-transform duration-300 lg:translate-x-0',
          'border-r border-white/[0.04]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/3 h-32 w-32 rounded-full bg-accent-600/10 blur-3xl" />

        {/* Brand */}
        <div className="relative flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 via-brand-500 to-accent-500 shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-white">Atlas</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Enterprise OS</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 space-y-1 overflow-y-auto px-4 py-2 scrollbar-none">
          <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
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
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active ? 'bg-white/[0.06] text-white' : 'text-ink-300 hover:bg-white/[0.03] hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-brand-400 to-accent-500" />
                )}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                    active
                      ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow'
                      : 'bg-white/[0.04] text-ink-400 group-hover:text-white group-hover:bg-white/[0.06]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-left">
                  <span className="block">{item.label}</span>
                  <span className={cn('block text-[11px]', active ? 'text-ink-400' : 'text-ink-500')}>
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}

          {/* Admin section */}
          <div className="pt-4">
            <p className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
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
                    'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active ? 'bg-white/[0.06] text-white' : 'text-ink-300 hover:bg-white/[0.03] hover:text-white',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-danger-400 to-danger-500" />
                  )}
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                      active
                        ? 'bg-gradient-to-br from-danger-500 to-danger-600 text-white shadow-soft'
                        : 'bg-white/[0.04] text-ink-400 group-hover:text-white group-hover:bg-white/[0.06]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block">{item.label}</span>
                    <span className={cn('block text-[11px]', active ? 'text-ink-400' : 'text-ink-500')}>
                      {item.description}
                    </span>
                  </span>
                  {item.badge && (
                    <span className="rounded-full bg-danger-500/15 px-2 py-0.5 text-[10px] font-semibold text-danger-400 ring-1 ring-inset ring-danger-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer upgrade card */}
        <div className="relative p-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-brand-600/20 via-ink-900/40 to-ink-900/60 p-4 backdrop-blur-sm">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl animate-glow-pulse" />
            <div className="relative flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-accent-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              <p className="text-sm font-semibold text-white">Atlas AI</p>
            </div>
            <p className="relative mt-2 text-xs leading-relaxed text-ink-400">
              Your AI workspace assistant — insights, summaries and automations.
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

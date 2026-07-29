import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  CalendarCheck,
  CalendarClock,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageKey =
  | 'dashboard'
  | 'employees'
  | 'departments'
  | 'projects'
  | 'tasks'
  | 'attendance'
  | 'meetings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}

const nav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & insights' },
  { key: 'employees', label: 'Employees', icon: Users, description: 'Manage your team' },
  { key: 'departments', label: 'Departments', icon: Building2, description: 'Org structure' },
  { key: 'projects', label: 'Projects', icon: FolderKanban, description: 'Initiatives & timelines' },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, description: 'Work items & progress' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck, description: 'Daily check-ins' },
  { key: 'meetings', label: 'Meetings', icon: CalendarClock, description: 'Scheduled sessions' },
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
          className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ink-950 text-ink-100 transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
              <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-white">Atlas</p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Office OS</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2 scrollbar-none">
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
                  active ? 'bg-white/10 text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-brand-400 to-accent-500" />
                )}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    active ? 'bg-gradient-to-br from-brand-500 to-accent-500 text-white' : 'bg-ink-800/60 text-ink-300 group-hover:text-white',
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
        </nav>

        {/* Footer card */}
        <div className="p-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600/20 via-ink-900 to-ink-900 p-4 ring-1 ring-white/10">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-500/30 blur-2xl" />
            <p className="relative text-sm font-semibold text-white">Need a hand?</p>
            <p className="relative mt-1 text-xs text-ink-400">
              Everything you manage lives here — people, projects and attendance in one place.
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

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Shield,
  LogOut,
  ChevronRight,
  CheckSquare,
  FolderKanban,
  CalendarCheck,
  TrendingUp,
  Users,
  Bell,
  Globe,
  Lock,
  HelpCircle,
  User,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatDate } from '@/lib/utils';
import type { AppData } from '@/hooks/useAppData';
import type { PageKey } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  data: AppData;
  onNavigate: (page: PageKey) => void;
}

export function ProfilePanel({ open, onClose, data, onNavigate }: ProfilePanelProps) {
  const { employees, tasks, projects, attendance, profiles } = data;
  const { employee, profile, isAdmin, signOut } = useAuth();

  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter((a) => a.work_date === today && a.status !== 'absent').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const myProfile = profiles.find((p) => p.employee_id === employee?.id) ?? profile;
  const profileFields = [employee?.name, employee?.email, employee?.phone, employee?.position, myProfile?.location, myProfile?.bio];
  const filled = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((filled / profileFields.length) * 100);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  function go(page: PageKey) {
    onNavigate(page);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-md animate-fade-in" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        className="relative ml-auto flex h-full w-full max-w-md flex-col bg-ink-900 shadow-float animate-slide-in-right overflow-y-auto border-l border-white/[0.06]"
      >
        <div className="relative h-32 bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 shrink-0">
          <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-4 top-4 h-28 w-28 rounded-full bg-accent-400/30 blur-xl" />
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative -mt-14 flex items-end justify-between px-6">
          <Avatar
            name={employee?.name ?? 'User'}
            src={employee?.avatar_url}
            size="xl"
            ring
            className="!h-24 !w-24 !text-2xl ring-4 ring-ink-900 shadow-float"
          />
          <div className="mb-1 flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white',
              isAdmin ? 'bg-danger-600' : 'bg-brand-600',
            )}>
              <Shield className="h-3 w-3" />
              {employee?.role ?? 'member'}
            </span>
          </div>
        </div>

        <div className="px-6 pt-3 pb-4">
          <h2 className="font-display text-xl font-bold text-white">{employee?.name ?? 'User'}</h2>
          <p className="text-sm font-medium text-brand-400">{employee?.position ?? 'Team Member'}</p>
          {myProfile?.bio && <p className="mt-2 text-sm text-ink-400 leading-relaxed">{myProfile.bio}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-ink-300 ring-1 ring-white/[0.06]">
              <Mail className="h-3.5 w-3.5 text-ink-500" />
              {employee?.email}
            </span>
            {employee?.phone && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-ink-300 ring-1 ring-white/[0.06]">
                <Phone className="h-3.5 w-3.5 text-ink-500" />
                {employee.phone}
              </span>
            )}
            {myProfile?.location && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-ink-300 ring-1 ring-white/[0.06]">
                <MapPin className="h-3.5 w-3.5 text-ink-500" />
                {myProfile.location}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-ink-500">
            Member since {employee?.hire_date ? formatDate(employee.hire_date, { month: 'long', year: 'numeric' }) : '—'}
          </p>
        </div>

        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-brand-500/10 to-accent-500/10 p-4 ring-1 ring-brand-500/20">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Profile completion</span>
            <span className="font-display text-sm font-bold text-brand-400">{profileCompletion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
          </div>
          {profileCompletion < 100 && (
            <p className="mt-2 text-xs text-ink-400">Update your profile to reach 100%</p>
          )}
        </div>

        <div className="px-4 pb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500 px-1">Workspace overview</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: 'Active staff', value: activeEmployees, page: 'employees' as PageKey },
              { icon: FolderKanban, label: 'Active projects', value: activeProjects, page: 'projects' as PageKey },
              { icon: CheckSquare, label: 'Open tasks', value: openTasks, page: 'tasks' as PageKey },
              { icon: CalendarCheck, label: 'Present today', value: presentToday, page: 'attendance' as PageKey },
            ].map(({ icon: Icon, label, value, page }) => (
              <button
                key={label}
                onClick={() => go(page)}
                className="flex items-center gap-3 rounded-xl bg-ink-850/60 p-3 text-left ring-1 ring-white/[0.06] transition-all hover:ring-brand-500/30"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-none text-white">{value}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">{label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => go('profile')}
            className="flex w-full items-center gap-3 rounded-xl bg-ink-850/60 p-3 text-left ring-1 ring-white/[0.06] transition-colors hover:bg-white/[0.03]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-ink-400">
              <User className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">View full profile</p>
              <p className="text-xs text-ink-400">Edit your details, photo, skills</p>
            </div>
            <ChevronRight className="h-4 w-4 text-ink-600" />
          </button>
        </div>

        <div className="mt-auto px-4 pb-8">
          <button
            onClick={() => { onClose(); signOut(); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger-500/20 bg-danger-500/10 py-3 text-sm font-semibold text-danger-400 transition-all hover:bg-danger-500/15 active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <p className="mt-3 text-center text-xs text-ink-500">Afferent Tech BD · OMS v2.0</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

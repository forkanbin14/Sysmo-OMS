import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Shield,
  Edit3,
  LogOut,
  Settings,
  ChevronRight,
  CheckSquare,
  FolderKanban,
  CalendarCheck,
  Trophy,
  Star,
  TrendingUp,
  Users,
  Bell,
  Moon,
  Globe,
  Lock,
  HelpCircle,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import type { AppData } from '@/hooks/useAppData';
import type { PageKey } from '@/components/layout/Sidebar';

/* ---------- static admin profile (single-user system) ---------- */
const ADMIN = {
  name: 'Alex Rivera',
  email: 'alex.rivera@office.co',
  phone: '+1 415 555 0199',
  position: 'Administrator',
  department: 'Engineering',
  location: 'San Francisco, CA',
  timezone: 'PST (UTC-8)',
  joinDate: '2018-01-15',
  bio: 'Managing the Atlas workspace and keeping the team aligned, projects on track and the office running smoothly.',
  avatar: null as string | null,
  role: 'Admin',
};

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  data: AppData;
  onNavigate: (page: PageKey) => void;
}

export function ProfilePanel({ open, onClose, data, onNavigate }: ProfilePanelProps) {
  const { employees, tasks, projects, attendance } = data;

  /* -- quick stats derived from live data -- */
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter((a) => a.work_date === today && a.status !== 'absent').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  /* -- profile completion -- */
  const profileFields = [ADMIN.name, ADMIN.email, ADMIN.phone, ADMIN.position, ADMIN.location, ADMIN.bio];
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
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel — slides in from the right */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-float animate-slide-in-right overflow-y-auto"
      >
        {/* ── Header banner ── */}
        <div className="relative h-32 bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 shrink-0">
          {/* decorative blobs */}
          <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-4 top-4 h-28 w-28 rounded-full bg-accent-400/30 blur-xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Avatar (overlaps banner) ── */}
        <div className="relative -mt-14 flex items-end justify-between px-6">
          <div className="group relative">
            <Avatar
              name={ADMIN.name}
              src={ADMIN.avatar}
              size="xl"
              ring
              className="!h-24 !w-24 !text-2xl ring-4 ring-white shadow-float"
            />
            <button className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-950/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
              <Shield className="h-3 w-3" />
              {ADMIN.role}
            </span>
          </div>
        </div>

        {/* ── Identity ── */}
        <div className="px-6 pt-3 pb-4">
          <h2 className="font-display text-xl font-bold text-ink-900">{ADMIN.name}</h2>
          <p className="text-sm font-medium text-brand-600">{ADMIN.position} · {ADMIN.department}</p>
          <p className="mt-2 text-sm text-ink-500 leading-relaxed">{ADMIN.bio}</p>

          {/* Contact chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 ring-1 ring-ink-200">
              <Mail className="h-3.5 w-3.5 text-ink-400" />
              {ADMIN.email}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 ring-1 ring-ink-200">
              <Phone className="h-3.5 w-3.5 text-ink-400" />
              {ADMIN.phone}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 ring-1 ring-ink-200">
              <MapPin className="h-3.5 w-3.5 text-ink-400" />
              {ADMIN.location}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600 ring-1 ring-ink-200">
              <Globe className="h-3.5 w-3.5 text-ink-400" />
              {ADMIN.timezone}
            </span>
          </div>

          {/* Join date */}
          <p className="mt-2 text-xs text-ink-400">
            Member since {formatDate(ADMIN.joinDate, { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Profile completion ── */}
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-brand-50 to-accent-50 p-4 ring-1 ring-brand-100">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-ink-800">Profile completion</span>
            </div>
            <span className="font-display text-sm font-bold text-brand-700">{profileCompletion}%</span>
          </div>
          <ProgressBar
            value={profileCompletion}
            barClassName="bg-gradient-to-r from-brand-500 to-accent-500"
          />
          {profileCompletion < 100 && (
            <p className="mt-2 text-xs text-ink-500">Add a profile photo to reach 100%</p>
          )}
        </div>

        {/* ── Live workspace stats ── */}
        <div className="px-4 pb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400 px-1">Workspace overview</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: 'Active staff', value: activeEmployees, tone: 'text-brand-600 bg-brand-50', page: 'employees' as PageKey },
              { icon: FolderKanban, label: 'Active projects', value: activeProjects, tone: 'text-accent-600 bg-accent-50', page: 'projects' as PageKey },
              { icon: CheckSquare, label: 'Open tasks', value: openTasks, tone: 'text-warning-600 bg-warning-50', page: 'tasks' as PageKey },
              { icon: CalendarCheck, label: 'Present today', value: presentToday, tone: 'text-success-600 bg-success-50', page: 'attendance' as PageKey },
            ].map(({ icon: Icon, label, value, tone, page }) => (
              <button
                key={label}
                onClick={() => go(page)}
                className="flex items-center gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-ink-200 transition-all hover:ring-brand-300 hover:shadow-card"
              >
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold leading-none text-ink-900">{value}</p>
                  <p className="mt-0.5 text-[11px] text-ink-500">{label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Task completion strip */}
          <div className="mt-3 rounded-xl bg-white p-3.5 ring-1 ring-ink-200">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                <TrendingUp className="h-4 w-4 text-success-500" />
                Task completion rate
              </span>
              <span className="font-display text-sm font-bold text-success-600">{completionRate}%</span>
            </div>
            <ProgressBar
              value={completionRate}
              barClassName={completionRate >= 70 ? 'bg-success-500' : completionRate >= 40 ? 'bg-brand-500' : 'bg-warning-500'}
            />
            <p className="mt-1.5 text-xs text-ink-400">{completedTasks} of {tasks.length} tasks completed</p>
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="px-4 pb-4">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-400">Quick navigate</p>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
            {([
              { icon: Users, label: 'Employees', desc: 'Manage team members', page: 'employees' as PageKey },
              { icon: FolderKanban, label: 'Projects', desc: 'Initiatives & timelines', page: 'projects' as PageKey },
              { icon: CheckSquare, label: 'Tasks', desc: 'Work items', page: 'tasks' as PageKey },
              { icon: CalendarCheck, label: 'Attendance', desc: 'Daily check-ins', page: 'attendance' as PageKey },
            ] as const).map(({ icon: Icon, label, desc, page }, idx, arr) => (
              <button
                key={label}
                onClick={() => go(page)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50',
                  idx < arr.length - 1 && 'border-b border-ink-100',
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">{label}</p>
                  <p className="text-xs text-ink-500">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-300" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Preferences ── */}
        <div className="px-4 pb-4">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ink-400">Preferences</p>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
            {([
              { icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
              { icon: Lock, label: 'Privacy & Security', desc: 'Passwords & sessions' },
              { icon: Globe, label: 'Language & Region', desc: 'English (US) · PST' },
              { icon: HelpCircle, label: 'Help & Support', desc: 'Docs & contact' },
            ]).map(({ icon: Icon, label, desc }, idx, arr) => (
              <button
                key={label}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-50',
                  idx < arr.length - 1 && 'border-b border-ink-100',
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">{label}</p>
                  <p className="text-xs text-ink-500">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-300" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Sign out ── */}
        <div className="mt-auto px-4 pb-8">
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger-200 bg-danger-50 py-3 text-sm font-semibold text-danger-600 transition-all hover:bg-danger-100 hover:border-danger-300 active:scale-[0.98]">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
          <p className="mt-3 text-center text-xs text-ink-400">Atlas Office OS · v1.0.0</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

import { useMemo, useState } from 'react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  CalendarCheck,
  ArrowUpRight,
  Clock,
  Briefcase,
  CircleDollarSign,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { PageKey } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { StatCard } from '@/components/shared/StatCard';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  ProjectStatusBadge,
  TaskStatusBadge,
  PriorityBadge,
} from '@/components/ui/StatusBadges';
import { cn, formatCurrency, formatDateShort, dueLabel } from '@/lib/utils';

interface DashboardProps {
  data: AppData;
  onNavigate: (page: PageKey) => void;
}

export function Dashboard({ data, onNavigate }: DashboardProps) {
  const { employees, projects, tasks, meetings, attendance, departments, loading } = data;

  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'active').length;
    const onLeave = employees.filter((e) => e.status === 'on-leave').length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const openTasks = tasks.filter((t) => t.status !== 'done').length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const completionRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
    const today = new Date().toISOString().slice(0, 10);
    const presentToday = attendance.filter((a) => a.work_date === today && a.status !== 'absent').length;
    const totalBudget = departments.reduce((sum, d) => sum + (d.budget ?? 0), 0);
    const upcomingMeetings = meetings
      .filter((m) => new Date(m.meeting_date) >= new Date(today))
      .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date))
      .slice(0, 4);
    return {
      activeEmployees, onLeave, activeProjects, openTasks, doneTasks,
      completionRate, presentToday, totalBudget, upcomingMeetings,
    };
  }, [employees, projects, tasks, meetings, attendance, departments]);

  const taskDist = useMemo(() => {
    const groups = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    tasks.forEach((t) => { groups[t.status]++; });
    return groups;
  }, [tasks]);

  const attendanceChart = useMemo(() => {
    const byDate = new Map<string, { present: number; late: number; remote: number; absent: number }>();
    attendance.forEach((a) => {
      const entry = byDate.get(a.work_date) ?? { present: 0, late: 0, remote: 0, absent: 0 };
      entry[a.status]++;
      byDate.set(a.work_date, entry);
    });
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);
  }, [attendance]);

  const maxAttendance = Math.max(1, ...attendanceChart.map(([, v]) => v.present + v.late + v.remote + v.absent));

  const deptHeadcount = useMemo(() => {
    return departments
      .map((d) => ({ ...d, count: employees.filter((e) => e.department_id === d.id).length }))
      .sort((a, b) => b.count - a.count);
  }, [departments, employees]);

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [tasks],
  );

  const activeProjectsList = useMemo(
    () => projects.filter((p) => p.status === 'active' || p.status === 'planning').slice(0, 5),
    [projects],
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* AI insight banner */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/15 bg-gradient-to-r from-brand-600/10 via-brand-600/[0.04] to-transparent p-4 sm:p-5 animate-fade-in">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/10 blur-3xl animate-glow-pulse" />
        <div className="relative flex items-start gap-3 sm:gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 shadow-brand-glow">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-display text-sm font-semibold text-white">Atlas AI Insight</p>
              <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-300 ring-1 ring-inset ring-brand-500/20">Daily</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-300">
              Your team is <span className="font-semibold text-white">{stats.completionRate}%</span> through all tasks
              with <span className="font-semibold text-white">{stats.presentToday}</span> people present today.
              {stats.openTasks > 0 && ` ${stats.openTasks} tasks still open — consider reviewing priorities.`}
            </p>
          </div>
          <button className="hidden shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[13px] font-medium text-ink-300 transition-colors hover:bg-white/[0.08] hover:text-white sm:block">
            View report
          </button>
        </div>
      </div>

      {/* Stat cards — 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 stagger">
        <StatCard label="Employees" value={stats.activeEmployees} icon={Users} tone="brand" hint={stats.onLeave > 0 ? `${stats.onLeave} on leave` : 'All hands on deck'} loading={loading} delay={0} />
        <StatCard label="Projects" value={stats.activeProjects} icon={FolderKanban} tone="accent" trend={{ value: '12%', up: true }} hint="vs last quarter" loading={loading} delay={60} />
        <StatCard label="Open Tasks" value={stats.openTasks} icon={CheckSquare} tone="warning" hint={`${stats.doneTasks} done`} loading={loading} delay={120} />
        <StatCard label="Present Today" value={stats.presentToday} icon={CalendarCheck} tone="success" trend={{ value: '94%', up: true }} hint="attendance" loading={loading} delay={180} />
      </div>

      {/* Charts row — stacked on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Task completion donut */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Task Completion</CardTitle>
              <CardDescription>Across all projects</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-5 sm:gap-6 pt-1">
              <ProgressRing value={stats.completionRate} size={120} strokeWidth={11} label={`${stats.completionRate}%`} className="sm:!scale-100" />
              <div className="grid w-full grid-cols-2 gap-2.5">
                {([
                  { key: 'done', label: 'Done', tone: 'bg-success-500', value: taskDist.done },
                  { key: 'in-progress', label: 'In Progress', tone: 'bg-accent-500', value: taskDist['in-progress'] },
                  { key: 'review', label: 'Review', tone: 'bg-warning-500', value: taskDist.review },
                  { key: 'todo', label: 'To Do', tone: 'bg-ink-400 dark:bg-ink-600', value: taskDist.todo },
                ] as const).map((g) => (
                  <div key={g.key} className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', g.tone)} />
                    <span className="text-[13px] text-ink-600 dark:text-ink-400">{g.label}</span>
                    <span className="ml-auto text-[13px] font-semibold tabular text-ink-900 dark:text-white">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Last 7 working days</CardDescription>
            </div>
            <div className="hidden items-center gap-3 text-[11px] text-ink-500 dark:text-ink-400 sm:flex">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-500" /> Present</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning-500" /> Late</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-500" /> Remote</span>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceChart.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-[13px] text-ink-400 dark:text-ink-500">No attendance records yet</div>
            ) : (
              <div className="flex h-44 items-end justify-between gap-2 pt-4 sm:h-52 sm:gap-3">
                {attendanceChart.map(([date, v]) => {
                  const total = v.present + v.late + v.remote + v.absent;
                  const heightPct = (total / maxAttendance) * 100;
                  return (
                    <div key={date} className="group flex flex-1 flex-col items-center gap-2">
                      <div className="relative flex w-full max-w-[40px] flex-col justify-end sm:max-w-[44px]" style={{ height: '140px' }}>
                        <div
                          className="flex w-full flex-col-reverse overflow-hidden rounded-lg transition-all duration-500 ease-out-quart group-hover:scale-[1.04] group-hover:shadow-brand-glow"
                          style={{ height: `calc(140px * ${heightPct / 100})` }}
                        >
                          {v.present > 0 && <div className="bg-success-500" style={{ flexGrow: v.present }} />}
                          {v.late > 0 && <div className="bg-warning-500" style={{ flexGrow: v.late }} />}
                          {v.remote > 0 && <div className="bg-accent-500" style={{ flexGrow: v.remote }} />}
                        </div>
                        <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-ink-800 px-2 py-0.5 text-[11px] font-semibold tabular text-white opacity-0 transition-all duration-200 group-hover:opacity-100 dark:bg-ink-700">
                          {total}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium tabular text-ink-500 dark:text-ink-400">{formatDateShort(date)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget + Meetings — stacked on mobile */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Department Budget</CardTitle>
              <CardDescription>Annual allocation</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-500/10 text-success-400 ring-1 ring-success-500/20 sm:h-14 sm:w-14">
                <CircleDollarSign className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-stat tabular text-ink-900 dark:text-white">
                  {formatCurrency(stats.totalBudget)}
                </p>
                <p className="mt-0.5 truncate text-[13px] text-ink-500 dark:text-ink-400">{departments.length} departments</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 sm:mt-5">
              {deptHeadcount.slice(0, 4).map((d) => {
                const budgetPct = stats.totalBudget > 0 ? ((d.budget ?? 0) / stats.totalBudget) * 100 : 0;
                return (
                  <div key={d.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[13px]">
                      <span className="truncate font-medium text-ink-700 dark:text-ink-200">{d.name}</span>
                      <span className="ml-2 shrink-0 tabular text-ink-500 dark:text-ink-400">{formatCurrency(d.budget)}</span>
                    </div>
                    <ProgressBar value={budgetPct} barClassName="bg-gradient-to-r from-brand-400 to-accent-400" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming meetings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Next on the calendar</CardDescription>
            </div>
            <button
              onClick={() => onNavigate('meetings')}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand-500 transition-colors hover:text-brand-400 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.upcomingMeetings.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-[13px] text-ink-400 dark:text-ink-500">No meetings scheduled</div>
            ) : (
              <div className="divide-y divide-ink-100 dark:divide-white/[0.06]">
                {stats.upcomingMeetings.map((m) => {
                  const meetingDate = new Date(m.meeting_date);
                  const day = meetingDate.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNum = meetingDate.getDate();
                  const isToday = m.meeting_date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={m.id} className="flex items-center gap-3 py-3 transition-colors hover:bg-ink-50/50 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-lg sm:gap-4">
                      <div
                        className={cn(
                          'flex h-11 w-11 flex-col items-center justify-center rounded-xl text-center shrink-0',
                          isToday ? 'bg-brand-600 text-white shadow-brand-glow' : 'bg-white/[0.04] text-ink-300 ring-1 ring-inset ring-white/[0.06] dark:text-ink-400',
                        )}
                      >
                        <span className="text-[10px] font-semibold uppercase">{day}</span>
                        <span className="font-display text-base font-bold leading-none tabular">{dateNum}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">{m.title}</p>
                        <p className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                          <Clock className="h-3 w-3" />
                          {m.start_time.slice(0, 5)} · {m.duration_minutes}m
                          {m.location && <span className="hidden sm:inline">· {m.location}</span>}
                        </p>
                      </div>
                      <Badge tone="neutral" soft>{m.attendees.length} attending</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent tasks + Project progress */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Latest work items</CardDescription>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand-500 transition-colors hover:text-brand-400 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-ink-100 dark:divide-white/[0.06]">
              {recentTasks.map((t) => {
                const due = dueLabel(t.due_date);
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3">
                    <Avatar name={t.assignee?.name ?? 'Unassigned'} src={t.assignee?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink-900 dark:text-white">{t.title}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-ink-400">{t.project?.name ?? 'No project'}</p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <TaskStatusBadge status={t.status} />
                    <span
                      className={cn(
                        'hidden w-16 text-right text-xs font-medium tabular md:block',
                        due.tone === 'overdue' ? 'text-danger-600 dark:text-danger-400' : due.tone === 'soon' ? 'text-warning-600 dark:text-warning-400' : 'text-ink-500 dark:text-ink-400',
                      )}
                    >
                      {due.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>Active initiatives</CardDescription>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand-500 transition-colors hover:text-brand-400 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-ink-100 dark:divide-white/[0.06]">
              {activeProjectsList.map((p) => (
                <div key={p.id} className="py-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-ink-400 ring-1 ring-inset ring-white/[0.06]">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">{p.name}</p>
                        <p className="truncate text-xs text-ink-500 dark:text-ink-400">{p.department?.name ?? '—'}</p>
                      </div>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <ProgressBar value={p.progress} showValue barClassName={p.progress >= 75 ? 'bg-success-500' : p.progress >= 40 ? 'bg-brand-500' : 'bg-warning-500'} />
                </div>
              ))}
              {activeProjectsList.length === 0 && (
                <div className="flex h-32 items-center justify-center text-[13px] text-ink-400 dark:text-ink-500">No projects yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import {
  Users,
  FolderKanban,
  CheckSquare,
  CalendarCheck,
  ArrowUpRight,
  Clock,
  CalendarClock,
  Briefcase,
  CircleDollarSign,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
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
import { ProgressBar as Bar } from '@/components/shared/ProgressBar';
import { cn, formatCurrency, formatDateShort, dueLabel } from '@/lib/utils';

interface DashboardProps {
  data: AppData;
  onNavigate: (page: 'employees' | 'projects' | 'tasks' | 'meetings' | 'attendance') => void;
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
      activeEmployees,
      onLeave,
      activeProjects,
      openTasks,
      doneTasks,
      completionRate,
      presentToday,
      totalBudget,
      upcomingMeetings,
    };
  }, [employees, projects, tasks, meetings, attendance, departments]);

  // Task distribution for donut
  const taskDist = useMemo(() => {
    const groups = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    tasks.forEach((t) => { groups[t.status]++; });
    return groups;
  }, [tasks]);

  // Attendance last 7 working days
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

  // Department headcount
  const deptHeadcount = useMemo(() => {
    return departments
      .map((d) => ({
        ...d,
        count: employees.filter((e) => e.department_id === d.id).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [departments, employees]);

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [tasks],
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        <StatCard
          label="Active Employees"
          value={stats.activeEmployees}
          icon={Users}
          tone="brand"
          hint={stats.onLeave > 0 ? `${stats.onLeave} on leave` : 'All hands on deck'}
          loading={loading}
          delay={0}
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon={FolderKanban}
          tone="accent"
          trend={{ value: '12%', up: true }}
          hint="vs last quarter"
          loading={loading}
          delay={60}
        />
        <StatCard
          label="Open Tasks"
          value={stats.openTasks}
          icon={CheckSquare}
          tone="warning"
          hint={`${stats.doneTasks} completed`}
          loading={loading}
          delay={120}
        />
        <StatCard
          label="Present Today"
          value={stats.presentToday}
          icon={CalendarCheck}
          tone="success"
          trend={{ value: '94%', up: true }}
          hint="attendance rate"
          loading={loading}
          delay={180}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Task completion donut */}
        <Card className="lg:col-span-1 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <CardHeader>
            <div>
              <CardTitle>Task Completion</CardTitle>
              <CardDescription>Across all projects</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6 pt-2">
              <ProgressRing value={stats.completionRate} size={140} strokeWidth={12} label={`${stats.completionRate}%`} />
              <div className="grid w-full grid-cols-2 gap-3">
                {([
                  { key: 'done', label: 'Done', tone: 'bg-success-500', value: taskDist.done },
                  { key: 'in-progress', label: 'In Progress', tone: 'bg-accent-500', value: taskDist['in-progress'] },
                  { key: 'review', label: 'Review', tone: 'bg-warning-500', value: taskDist.review },
                  { key: 'todo', label: 'To Do', tone: 'bg-ink-300', value: taskDist.todo },
                ] as const).map((g) => (
                  <div key={g.key} className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', g.tone)} />
                    <span className="text-sm text-ink-600">{g.label}</span>
                    <span className="ml-auto text-sm font-semibold text-ink-900">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance bar chart */}
        <Card className="lg:col-span-2 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <CardHeader>
            <div>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Last 7 working days</CardDescription>
            </div>
            <div className="hidden items-center gap-4 text-xs text-ink-500 dark:text-ink-400 sm:flex">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success-500" /> Present</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning-500" /> Late</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent-500" /> Remote</span>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceChart.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-ink-400 dark:text-ink-500">No attendance records yet</div>
            ) : (
              <div className="flex h-52 items-end justify-between gap-3 pt-4">
                {attendanceChart.map(([date, v]) => {
                  const total = v.present + v.late + v.remote + v.absent;
                  const heightPct = (total / maxAttendance) * 100;
                  return (
                    <div key={date} className="group flex flex-1 flex-col items-center gap-2">
                      <div className="relative flex w-full max-w-[44px] flex-col justify-end" style={{ height: '160px' }}>
                        <div
                          className="flex w-full flex-col-reverse overflow-hidden rounded-lg transition-all duration-500 group-hover:scale-[1.04]"
                          style={{ height: `${heightPct}%` }}
                        >
                          {v.present > 0 && <div className="bg-success-500" style={{ flexGrow: v.present }} />}
                          {v.late > 0 && <div className="bg-warning-500" style={{ flexGrow: v.late }} />}
                          {v.remote > 0 && <div className="bg-accent-500" style={{ flexGrow: v.remote }} />}
                        </div>
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-ink-900 px-2 py-0.5 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-ink-700">
                          {total}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-ink-500 dark:text-ink-400">{formatDateShort(date)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget + Department headcount */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <CardHeader>
            <div>
              <CardTitle>Total Department Budget</CardTitle>
              <CardDescription>Combined annual allocation</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-1 ring-success-100 dark:bg-success-500/15 dark:text-success-400 dark:ring-success-500/25">
                <CircleDollarSign className="h-8 w-8" />
              </div>
              <div>
                <p className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                  {formatCurrency(stats.totalBudget)}
                </p>
                <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">across {departments.length} departments</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {deptHeadcount.slice(0, 4).map((d) => {
                const budgetPct = stats.totalBudget > 0 ? ((d.budget ?? 0) / stats.totalBudget) * 100 : 0;
                return (
                  <div key={d.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-ink-700 dark:text-ink-200">{d.name}</span>
                      <span className="text-ink-500 dark:text-ink-400">{formatCurrency(d.budget)}</span>
                    </div>
                    <ProgressBar value={budgetPct} barClassName="bg-gradient-to-r from-brand-400 to-accent-400" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming meetings */}
        <Card className="lg:col-span-2 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <CardHeader>
            <div>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Next on the calendar</CardDescription>
            </div>
            <button
              onClick={() => onNavigate('meetings')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.upcomingMeetings.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-ink-400">No meetings scheduled</div>
            ) : (
              <div className="divide-y divide-ink-100">
                {stats.upcomingMeetings.map((m) => {
                  const meetingDate = new Date(m.meeting_date);
                  const day = meetingDate.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNum = meetingDate.getDate();
                  const isToday = m.meeting_date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={m.id} className="flex items-center gap-4 py-3.5 transition-colors hover:bg-ink-50/50 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-lg">
                      <div
                        className={cn(
                          'flex h-12 w-12 flex-col items-center justify-center rounded-xl text-center shrink-0',
                          isToday ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700 dark:bg-ink-700/40 dark:text-ink-300',
                        )}
                      >
                        <span className="text-[10px] font-semibold uppercase">{day}</span>
                        <span className="font-display text-lg font-bold leading-none">{dateNum}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{m.title}</p>
                        <p className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
                          <Clock className="h-3.5 w-3.5" />
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
          <CardHeader>
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Latest created work items</CardDescription>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-4 w-4" />
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
                      <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{t.title}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-ink-400">{t.project?.name ?? 'No project'}</p>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <TaskStatusBadge status={t.status} />
                    <span
                      className={cn(
                        'hidden w-16 text-right text-xs font-medium md:block',
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

        <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
          <CardHeader>
            <div>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>Active and planning initiatives</CardDescription>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-ink-100 dark:divide-white/[0.06]">
              {projects.slice(0, 5).map((p) => (
                <div key={p.id} className="py-3.5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{p.name}</p>
                        <p className="truncate text-xs text-ink-500 dark:text-ink-400">{p.department?.name ?? '—'}</p>
                      </div>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <Bar value={p.progress} showValue barClassName={p.progress >= 75 ? 'bg-success-500' : p.progress >= 40 ? 'bg-brand-500' : 'bg-warning-500'} />
                </div>
              ))}
              {projects.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-ink-400 dark:text-ink-500">No projects yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import type {
  Employee,
  Project,
  Task,
  Meeting,
} from '@/types/database';
import type { AppData } from '@/hooks/useAppData';

export type RecType =
  | 'overworked'
  | 'unassigned'
  | 'overdue'
  | 'at-risk-project'
  | 'no-assignee'
  | 'stagnant'
  | 'budget'
  | 'attendance'
  | 'meeting-prep';

export type RecSeverity = 'high' | 'medium' | 'low';
export type RecTone = 'danger' | 'warning' | 'accent' | 'brand' | 'success';

export interface Recommendation {
  id: string;
  type: RecType;
  severity: RecSeverity;
  tone: RecTone;
  icon: string; // lucide icon name
  title: string;
  reason: string;
  action: string; // suggested next action
  page: 'dashboard' | 'employees' | 'departments' | 'projects' | 'tasks' | 'attendance' | 'meetings';
  /** optional target entity id */
  targetId?: string;
  /** confidence 0-100 */
  confidence: number;
}

const daysFromNow = (date: string | null | undefined): number => {
  if (!date) return 0;
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export function generateRecommendations(data: AppData): Recommendation[] {
  const { employees, projects, tasks, meetings, departments, attendance } = data;
  const recs: Recommendation[] = [];

  // === Overworked employees — too many open high-priority tasks ===
  const workload = new Map<string, { open: number; high: number; done: number }>();
  employees.forEach((e) => workload.set(e.id, { open: 0, high: 0, done: 0 }));
  tasks.forEach((t) => {
    if (!t.assignee_id) return;
    const w = workload.get(t.assignee_id);
    if (!w) return;
    if (t.status === 'done') w.done++;
    else {
      w.open++;
      if (t.priority === 'high') w.high++;
    }
  });
  workload.forEach((w, empId) => {
    if (w.open >= 3 && w.high >= 1) {
      const emp = employees.find((e) => e.id === empId);
      recs.push({
        id: `overworked-${empId}`,
        type: 'overworked',
        severity: 'high',
        tone: 'danger',
        icon: 'UserX',
        title: `${emp?.name ?? 'Someone'} is overloaded`,
        reason: `${w.open} open tasks (${w.high} high priority) — consider redistributing.`,
        action: 'Reassign or close completed work',
        page: 'employees',
        targetId: empId,
        confidence: 85,
      });
    }
  });

  // === Unassigned tasks ===
  const unassigned = tasks.filter((t) => !t.assignee_id && t.status !== 'done');
  if (unassigned.length > 0) {
    recs.push({
      id: 'unassigned-tasks',
      type: 'unassigned',
      severity: 'medium',
      tone: 'warning',
      icon: 'UserPlus',
      title: `${unassigned.length} task${unassigned.length > 1 ? 's' : ''} with no assignee`,
      reason: `Work is sitting idle. Assign someone to keep momentum.`,
      action: 'Assign owners now',
      page: 'tasks',
      confidence: 90,
    });
  }

  // === Overdue tasks ===
  const overdue = tasks.filter((t) => t.status !== 'done' && daysFromNow(t.due_date) < 0);
  if (overdue.length > 0) {
    const sample = overdue[0];
    recs.push({
      id: 'overdue-tasks',
      type: 'overdue',
      severity: 'high',
      tone: 'danger',
      icon: 'AlertTriangle',
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      reason: overdue.length === 1
        ? `"${sample.title}" was due ${Math.abs(daysFromNow(sample.due_date))}d ago${sample.assignee ? ` (${sample.assignee.name})` : ''}.`
        : `Oldest is ${Math.abs(daysFromNow(overdue[0].due_date))}d past due.`,
      action: 'Review and reschedule',
      page: 'tasks',
      targetId: sample.id,
      confidence: 95,
    });
  }

  // === At-risk projects — active, due soon, low progress ===
  projects.forEach((p) => {
    const days = daysFromNow(p.due_date);
    const projTasks = tasks.filter((t) => t.project_id === p.id);
    const isStalled = projTasks.length > 0 && projTasks.every((t) => t.status === 'todo');
    if (p.status === 'active' && days >= 0 && days <= 7 && p.progress < 60) {
      recs.push({
        id: `at-risk-${p.id}`,
        type: 'at-risk-project',
        severity: 'high',
        tone: 'warning',
        icon: 'Flag',
        title: `${p.name} is at risk`,
        reason: `Only ${p.progress}% done with ${days === 0 ? 'today' : `${days}d`} left until ${p.due_date ? 'deadline' : 'due'}.`,
        action: 'Check blockers and reassign',
        page: 'projects',
        targetId: p.id,
        confidence: 80,
      });
    }
    if (p.status === 'active' && isStalled && projTasks.length >= 2) {
      recs.push({
        id: `stagnant-${p.id}`,
        type: 'stagnant',
        severity: 'medium',
        tone: 'accent',
        icon: 'PauseCircle',
        title: `${p.name} hasn't started moving`,
        reason: `All ${projTasks.length} tasks are still in "To Do" — nothing in progress.`,
        action: 'Kick off the first task',
        page: 'projects',
        targetId: p.id,
        confidence: 75,
      });
    }
  });

  // === Attendance anomalies — someone late multiple days ===
  const lateCounts = new Map<string, number>();
  attendance.forEach((a) => {
    if (a.status === 'late') lateCounts.set(a.employee_id, (lateCounts.get(a.employee_id) ?? 0) + 1);
  });
  lateCounts.forEach((count, empId) => {
    if (count >= 3) {
      const emp = employees.find((e) => e.id === empId);
      recs.push({
        id: `attendance-${empId}`,
        type: 'attendance',
        severity: 'medium',
        tone: 'warning',
        icon: 'Clock',
        title: `${emp?.name ?? 'Someone'} has been late ${count} times recently`,
        reason: 'A pattern may be forming worth a check-in conversation.',
        action: 'Review attendance history',
        page: 'attendance',
        targetId: empId,
        confidence: 65,
      });
    }
  });

  // === Meeting prep — upcoming meeting with no agenda ===
  const today = new Date().toISOString().slice(0, 10);
  const upcomingNoAgenda = meetings.find(
    (m) => m.meeting_date >= today && (!m.agenda || m.agenda.trim().length === 0),
  );
  if (upcomingNoAgenda) {
    recs.push({
      id: `meeting-prep-${upcomingNoAgenda.id}`,
      type: 'meeting-prep',
      severity: 'low',
      tone: 'brand',
      icon: 'CalendarClock',
      title: `"${upcomingNoAgenda.title}" has no agenda`,
      reason: `Scheduled for ${upcomingNoAgenda.meeting_date} — add an agenda to keep it focused.`,
      action: 'Add an agenda',
      page: 'meetings',
      targetId: upcomingNoAgenda.id,
      confidence: 70,
    });
  }

  // === Department with no head ===
  departments.forEach((d) => {
    if (!d.head_name) {
      recs.push({
        id: `no-head-${d.id}`,
        type: 'no-assignee',
        severity: 'low',
        tone: 'accent',
        icon: 'Building2',
        title: `${d.name} has no department head`,
        reason: 'No one is accountable for this team right now.',
        action: 'Assign a department head',
        page: 'departments',
        targetId: d.id,
        confidence: 60,
      });
    }
  });

  // Sort by severity then confidence
  const severityRank: Record<RecSeverity, number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    return b.confidence - a.confidence;
  });
}

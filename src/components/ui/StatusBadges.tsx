import type {
  EmployeeStatus,
  ProjectStatus,
  Priority,
  TaskStatus,
  AttendanceStatus,
} from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import type { Tone } from '@/components/ui/Badge';

type LabelMap<T extends string> = Record<T, { label: string; tone: Tone }>;

export const employeeStatusMeta: LabelMap<EmployeeStatus> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  'on-leave': { label: 'On Leave', tone: 'warning' },
};

export const projectStatusMeta: LabelMap<ProjectStatus> = {
  planning: { label: 'Planning', tone: 'accent' },
  active: { label: 'Active', tone: 'success' },
  'on-hold': { label: 'On Hold', tone: 'warning' },
  completed: { label: 'Completed', tone: 'neutral' },
};

export const taskStatusMeta: LabelMap<TaskStatus> = {
  todo: { label: 'To Do', tone: 'neutral' },
  'in-progress': { label: 'In Progress', tone: 'accent' },
  review: { label: 'Review', tone: 'warning' },
  done: { label: 'Done', tone: 'success' },
};

export const priorityMeta: LabelMap<Priority> = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'warning' },
  high: { label: 'High', tone: 'danger' },
};

export const attendanceMeta: LabelMap<AttendanceStatus> = {
  present: { label: 'Present', tone: 'success' },
  absent: { label: 'Absent', tone: 'danger' },
  late: { label: 'Late', tone: 'warning' },
  remote: { label: 'Remote', tone: 'accent' },
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const m = employeeStatusMeta[status];
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}
export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const m = projectStatusMeta[status];
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const m = taskStatusMeta[status];
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = priorityMeta[priority];
  return <Badge tone={m.tone}>{m.label}</Badge>;
}
export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const m = attendanceMeta[status];
  return <Badge tone={m.tone} dot>{m.label}</Badge>;
}

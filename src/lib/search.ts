import type {
  Employee,
  Project,
  Task,
  Meeting,
  Department,
} from '@/types/database';
import type { AppData } from '@/hooks/useAppData';

export type EntityType = 'employee' | 'project' | 'task' | 'meeting' | 'department' | 'page';

export interface SearchResult {
  id: string;
  type: EntityType;
  title: string;
  subtitle: string;
  meta?: string;
  score: number;
  avatar?: string | null;
  badge?: { label: string; tone: string };
  /** page to navigate to when selected */
  page: 'dashboard' | 'employees' | 'departments' | 'projects' | 'tasks' | 'attendance' | 'meetings';
}

/** Normalize text for matching: lowercase, collapse whitespace, strip diacritics. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fuzzy match score. Returns 0 if no match.
 * - Exact match: 100
 * - Starts with query: 80
 * - Word-boundary match: 60
 * - Contains (all query chars in order, not necessarily adjacent): 40
 * - Fuzzy subsequence: 20
 */
function matchScore(query: string, target: string): number {
  if (!query) return 0;
  const q = normalize(query);
  const t = normalize(target);
  if (!q || !t) return 0;

  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 70;

  // Word-boundary match — any word in target starts with query
  const words = t.split(' ');
  if (words.some((w) => w.startsWith(q))) return 60;

  // Fuzzy subsequence — all query chars appear in order
  let qi = 0;
  let matched = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      matched++;
    }
  }
  if (qi === q.length) {
    // Reward how compact the match is
    return Math.max(15, 40 - Math.round((t.length - q.length) * 0.5));
  }
  return 0;
}

/** Combine multiple field scores, taking the max as the primary match. */
function bestScore(query: string, ...fields: (string | null | undefined)[]): number {
  let best = 0;
  for (const field of fields) {
    const s = matchScore(query, field ?? '');
    if (s > best) best = s;
  }
  return best;
}

const MIN_SCORE = 15;

export function searchAll(query: string, data: AppData): SearchResult[] {
  if (!query.trim()) return [];
  const { employees, projects, tasks, meetings, departments } = data;
  const results: SearchResult[] = [];

  // Employees
  employees.forEach((e) => {
    const score = bestScore(query, e.name, e.email, e.position, e.department?.name, e.phone);
    if (score >= MIN_SCORE) {
      results.push({
        id: e.id,
        type: 'employee',
        title: e.name,
        subtitle: e.position ?? 'No position',
        meta: e.department?.name ?? 'Unassigned',
        score,
        avatar: e.avatar_url,
        badge: { label: e.status, tone: e.status === 'active' ? 'success' : e.status === 'on-leave' ? 'warning' : 'neutral' },
        page: 'employees',
      });
    }
  });

  // Projects
  projects.forEach((p) => {
    const score = bestScore(query, p.name, p.description, p.department?.name);
    if (score >= MIN_SCORE) {
      results.push({
        id: p.id,
        type: 'project',
        title: p.name,
        subtitle: p.description?.slice(0, 60) ?? 'No description',
        meta: `${p.progress}% complete · ${p.department?.name ?? 'No dept'}`,
        score,
        badge: { label: p.status, tone: p.status === 'active' ? 'success' : p.status === 'completed' ? 'neutral' : 'accent' },
        page: 'projects',
      });
    }
  });

  // Tasks
  tasks.forEach((t) => {
    const score = bestScore(query, t.title, t.description, t.project?.name, t.assignee?.name);
    if (score >= MIN_SCORE) {
      results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: t.project?.name ?? 'No project',
        meta: t.assignee?.name ?? 'Unassigned',
        score,
        avatar: t.assignee?.avatar_url,
        badge: { label: t.status, tone: t.status === 'done' ? 'success' : t.status === 'in-progress' ? 'accent' : 'neutral' },
        page: 'tasks',
      });
    }
  });

  // Meetings
  meetings.forEach((m) => {
    const score = bestScore(query, m.title, m.agenda, m.location, m.attendees.join(' '));
    if (score >= MIN_SCORE) {
      results.push({
        id: m.id,
        type: 'meeting',
        title: m.title,
        subtitle: m.agenda?.slice(0, 60) ?? 'No agenda',
        meta: `${m.meeting_date} · ${m.start_time.slice(0, 5)}`,
        score,
        badge: { label: 'Meeting', tone: 'brand' },
        page: 'meetings',
      });
    }
  });

  // Departments
  departments.forEach((d) => {
    const score = bestScore(query, d.name, d.description, d.head_name);
    if (score >= MIN_SCORE) {
      results.push({
        id: d.id,
        type: 'department',
        title: d.name,
        subtitle: d.head_name ?? 'No head assigned',
        meta: d.description?.slice(0, 50) ?? '',
        score,
        badge: { label: 'Dept', tone: 'neutral' },
        page: 'departments',
      });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/** Page shortcuts — always available as quick-jump results. */
export const pageShortcuts: SearchResult[] = [
  { id: 'page-dashboard', type: 'page', title: 'Dashboard', subtitle: 'Overview & insights', score: 0, page: 'dashboard' },
  { id: 'page-employees', type: 'page', title: 'Employees', subtitle: 'Manage your team', score: 0, page: 'employees' },
  { id: 'page-departments', type: 'page', title: 'Departments', subtitle: 'Org structure', score: 0, page: 'departments' },
  { id: 'page-projects', type: 'page', title: 'Projects', subtitle: 'Initiatives & timelines', score: 0, page: 'projects' },
  { id: 'page-tasks', type: 'page', title: 'Tasks', subtitle: 'Work items & progress', score: 0, page: 'tasks' },
  { id: 'page-attendance', type: 'page', title: 'Attendance', subtitle: 'Daily check-ins', score: 0, page: 'attendance' },
  { id: 'page-meetings', type: 'page', title: 'Meetings', subtitle: 'Scheduled sessions', score: 0, page: 'meetings' },
];

/** Filter page shortcuts by query. */
export function searchPages(query: string): SearchResult[] {
  if (!query.trim()) return pageShortcuts;
  return pageShortcuts
    .map((p) => ({ ...p, score: bestScore(query, p.title, p.subtitle) }))
    .filter((p) => p.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);
}

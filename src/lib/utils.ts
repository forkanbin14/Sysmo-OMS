export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '—';
  // Time stored as HH:mm:ss
  const [h, m] = time.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function daysFromNow(date: string | null | undefined): number {
  if (!date) return 0;
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function dueLabel(date: string | null | undefined): { label: string; tone: 'overdue' | 'soon' | 'normal' } {
  const days = daysFromNow(date);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: 'overdue' };
  if (days === 0) return { label: 'Due today', tone: 'soon' };
  if (days <= 3) return { label: `In ${days}d`, tone: 'soon' };
  return { label: formatDateShort(date), tone: 'normal' };
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-brand-400 to-brand-600',
  'from-accent-400 to-accent-600',
  'from-success-400 to-success-600',
  'from-warning-400 to-warning-600',
  'from-danger-400 to-danger-600',
  'from-brand-500 to-accent-500',
  'from-accent-500 to-success-500',
];

export function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function sortBy<T>(arr: T[], key: (item: T) => string | number, dir: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const av = key(a);
    const bv = key(b);
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

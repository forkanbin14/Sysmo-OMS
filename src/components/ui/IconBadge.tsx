import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface IconBadgeProps {
  icon: LucideIcon;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100 dark:bg-brand-500/15 dark:text-brand-400 dark:ring-brand-500/25',
  accent: 'bg-accent-50 text-accent-600 ring-accent-100 dark:bg-accent-500/15 dark:text-accent-400 dark:ring-accent-500/25',
  success: 'bg-success-50 text-success-600 ring-success-100 dark:bg-success-500/15 dark:text-success-400 dark:ring-success-500/25',
  warning: 'bg-warning-50 text-warning-600 ring-warning-100 dark:bg-warning-500/15 dark:text-warning-400 dark:ring-warning-500/25',
  danger: 'bg-danger-50 text-danger-600 ring-danger-100 dark:bg-danger-500/15 dark:text-danger-400 dark:ring-danger-500/25',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200 dark:bg-ink-700/40 dark:text-ink-300 dark:ring-ink-600/50',
};

const sizes = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function IconBadge({ icon: Icon, tone = 'brand', size = 'md', className }: IconBadgeProps) {
  return (
    <span className={cn('inline-flex items-center justify-center ring-1', tones[tone], sizes[size], className)}>
      <Icon className={iconSizes[size]} />
    </span>
  );
}

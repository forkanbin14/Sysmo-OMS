import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const tones: Record<Tone, { solid: string; soft: string; dot: string }> = {
  brand:   { solid: 'bg-brand-600 text-white',           soft: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25',           dot: 'bg-brand-500' },
  accent:  { solid: 'bg-accent-600 text-white',          soft: 'bg-accent-50 text-accent-700 ring-accent-200 dark:bg-accent-500/15 dark:text-accent-300 dark:ring-accent-500/25',       dot: 'bg-accent-500' },
  success: { solid: 'bg-success-600 text-white',         soft: 'bg-success-50 text-success-700 ring-success-200 dark:bg-success-500/15 dark:text-success-300 dark:ring-success-500/25',   dot: 'bg-success-500' },
  warning: { solid: 'bg-warning-500 text-white',         soft: 'bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-500/15 dark:text-warning-300 dark:ring-warning-500/25', dot: 'bg-warning-500' },
  danger:  { solid: 'bg-danger-600 text-white',          soft: 'bg-danger-50 text-danger-700 ring-danger-200 dark:bg-danger-500/15 dark:text-danger-300 dark:ring-danger-500/25',       dot: 'bg-danger-500' },
  neutral: { solid: 'bg-ink-700 text-white',             soft: 'bg-ink-100 text-ink-700 ring-ink-200 dark:bg-ink-700/40 dark:text-ink-300 dark:ring-ink-600/50',                         dot: 'bg-ink-500' },
};

export function Badge({ tone = 'neutral', dot = false, soft = true, className, children, ...props }: BadgeProps & { soft?: boolean }) {
  const t = tones[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        soft ? t.soft : t.solid,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />}
      {children}
    </span>
  );
}

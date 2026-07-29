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
  brand: 'bg-brand-50 text-brand-600 ring-brand-100',
  accent: 'bg-accent-50 text-accent-600 ring-accent-100',
  success: 'bg-success-50 text-success-600 ring-success-100',
  warning: 'bg-warning-50 text-warning-600 ring-warning-100',
  danger: 'bg-danger-50 text-danger-600 ring-danger-100',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
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

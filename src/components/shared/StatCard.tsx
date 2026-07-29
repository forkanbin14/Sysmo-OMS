import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const toneIcon: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20',
  accent: 'bg-accent-50 text-accent-600 ring-accent-100 dark:bg-accent-500/10 dark:text-accent-400 dark:ring-accent-500/20',
  success: 'bg-success-50 text-success-600 ring-success-100 dark:bg-success-500/10 dark:text-success-400 dark:ring-success-500/20',
  warning: 'bg-warning-50 text-warning-600 ring-warning-100 dark:bg-warning-500/10 dark:text-warning-400 dark:ring-warning-500/20',
  danger: 'bg-danger-50 text-danger-600 ring-danger-100 dark:bg-danger-500/10 dark:text-danger-400 dark:ring-danger-500/20',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200 dark:bg-white/5 dark:text-ink-300 dark:ring-white/[0.06]',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  trend?: { value: string; up: boolean };
  hint?: string;
  loading?: boolean;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', trend, hint, loading, delay = 0 }: StatCardProps) {
  return (
    <Card
      hover
      className="group p-5 animate-slide-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-ink-500 dark:text-ink-400">{label}</p>
          {loading ? (
            <div className="skeleton mt-2 h-8 w-24" />
          ) : (
            <p className="mt-1 font-display text-stat tabular text-ink-900 dark:text-white">{value}</p>
          )}
          {(trend || hint) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[11px] font-semibold tabular',
                    trend.up ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400',
                  )}
                >
                  {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend.value}
                </span>
              )}
              {hint && <span className="text-[11px] text-ink-400 dark:text-ink-500">{hint}</span>}
            </div>
          )}
        </div>
        <span
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform duration-300 ease-out-quart group-hover:scale-105',
            toneIcon[tone],
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </Card>
  );
}

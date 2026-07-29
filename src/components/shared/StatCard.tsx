import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const toneRing: Record<Tone, string> = {
  brand: 'ring-brand-100',
  accent: 'ring-accent-100',
  success: 'ring-success-100',
  warning: 'ring-warning-100',
  danger: 'ring-danger-100',
  neutral: 'ring-ink-200',
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
      className="p-5 animate-slide-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-500">{label}</p>
          {loading ? (
            <div className="skeleton mt-2 h-8 w-24" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold tracking-tight text-ink-900">{value}</p>
          )}
          {(trend || hint) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold',
                    trend.up ? 'text-success-600' : 'text-danger-600',
                  )}
                >
                  {trend.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {trend.value}
                </span>
              )}
              {hint && <span className="text-xs text-ink-400">{hint}</span>}
            </div>
          )}
        </div>
        <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1', toneRing[tone])}>
          <Icon className="h-6 w-6 text-ink-700" />
        </span>
      </div>
    </Card>
  );
}

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
  barClassName?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, className, barClassName = 'bg-brand-500', showValue = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', barClassName)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showValue && <span className="w-10 text-right text-xs font-semibold tabular-nums text-ink-600">{Math.round(clamped)}%</span>}
    </div>
  );
}

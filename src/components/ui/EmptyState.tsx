import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center animate-fade-in">
      <div className="relative mb-5">
        <div className="absolute inset-0 -m-3 rounded-3xl bg-brand-500/10 blur-2xl dark:bg-brand-500/15" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent dark:from-white/[0.06]">
          <Icon className="h-6 w-6 text-ink-400 dark:text-ink-500" />
        </div>
      </div>
      <h3 className="font-display text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

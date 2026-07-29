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
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center animate-fade-in">
      <div className="relative mb-5">
        <div className="absolute inset-0 -m-2 rounded-2xl bg-brand-100/60 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-ink-100 ring-1 ring-ink-200">
          <Icon className="h-7 w-7 text-brand-500" />
        </div>
      </div>
      <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

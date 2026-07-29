import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-soft hover:bg-brand-500 hover:shadow-glow focus-visible:ring-brand-500/40 dark:hover:bg-brand-500 dark:shadow-dark-glow',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-150 focus-visible:ring-ink-400/30 dark:bg-white/[0.06] dark:text-ink-100 dark:hover:bg-white/[0.10] dark:border dark:border-white/[0.06]',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-ink-400/30 dark:text-ink-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
  danger:
    'bg-danger-600 text-white shadow-soft hover:bg-danger-500 focus-visible:ring-danger-500/40',
  outline:
    'border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 focus-visible:ring-ink-400/30 dark:border-white/[0.08] dark:bg-transparent dark:text-ink-200 dark:hover:bg-white/[0.04] dark:hover:border-white/[0.12]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-10 px-4',
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-10 w-10 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('btn-base', variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

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
    'bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-glow focus-visible:ring-brand-500/30',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-200 focus-visible:ring-ink-400/30',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-ink-400/30',
  danger:
    'bg-danger-600 text-white shadow-soft hover:bg-danger-700 focus-visible:ring-danger-500/30',
  outline:
    'border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 focus-visible:ring-ink-400/30',
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

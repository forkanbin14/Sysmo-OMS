import { useState } from 'react';
import { cn, initials, avatarGradient } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

export function Avatar({ name, src, size = 'md', className, ring = false }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const base = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
    sizes[size],
    ring && 'ring-2 ring-white/90 dark:ring-ink-800/90 shadow-soft',
    className,
  );

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(base, 'object-cover object-top')}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className={cn(base, 'bg-gradient-to-br select-none', avatarGradient(name))}>
      {initials(name)}
    </span>
  );
}

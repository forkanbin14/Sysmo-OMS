import type { Employee } from '@/types/database';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface ClickableAvatarProps {
  employee?: Employee | null;
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
  onViewProfile?: (empId: string) => void;
}

export function ClickableAvatar({
  employee,
  name,
  src,
  size = 'md',
  className,
  ring = false,
  onViewProfile,
}: ClickableAvatarProps) {
  if (!employee || !onViewProfile) {
    return <Avatar name={name} src={src} size={size} className={className} ring={ring} />;
  }

  return (
    <button
      onClick={() => onViewProfile(employee.id)}
      className="rounded-full transition-transform hover:scale-105 active:scale-95"
      title={`View ${employee.name}'s profile`}
    >
      <Avatar name={name} src={src} size={size} className={cn('cursor-pointer', className)} ring={ring} />
    </button>
  );
}

interface ClickableNameProps {
  employee?: Employee | null;
  name: string;
  className?: string;
  onViewProfile?: (empId: string) => void;
}

export function ClickableName({ employee, name, className, onViewProfile }: ClickableNameProps) {
  if (!employee || !onViewProfile) {
    return <span className={className}>{name}</span>;
  }

  return (
    <button
      onClick={() => onViewProfile(employee.id)}
      className={cn(
        'cursor-pointer font-semibold text-ink-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-400',
        className,
      )}
    >
      {name}
    </button>
  );
}

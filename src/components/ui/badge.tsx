import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default:
    'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  secondary:
    'bg-slate-700/50 text-slate-300 border-slate-600/50',
  outline:
    'bg-transparent text-slate-300 border-slate-600',
  destructive:
    'bg-rose-500/15 text-rose-400 border-rose-500/25',
  success:
    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
} as const;

type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

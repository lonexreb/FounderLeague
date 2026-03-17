'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = {
  variant: {
    default:
      'bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20',
    outline:
      'border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:border-slate-600',
    ghost:
      'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100',
    destructive:
      'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20',
  },
  size: {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-12 px-6 text-base rounded-lg',
  },
} as const;

type ButtonVariant = keyof typeof buttonVariants.variant;
type ButtonSize = keyof typeof buttonVariants.size;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      'inline-flex items-center justify-center font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
      'disabled:opacity-50 disabled:pointer-events-none',
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      className
    );

    if (asChild) {
      // Render child element with button styles
      const child = React.Children.only(children) as React.ReactElement<
        Record<string, unknown>
      >;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className as string),
        ref,
        ...props,
      });
    }

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

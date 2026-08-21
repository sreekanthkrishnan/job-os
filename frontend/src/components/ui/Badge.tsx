import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  pulse = false,
  className,
  ...props
}) => {
  const variantStyles = {
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40 font-semibold',
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-semibold',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-semibold',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/40 font-semibold',
    slate: 'bg-slate-800/90 text-slate-200 border-slate-700 font-semibold',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
};

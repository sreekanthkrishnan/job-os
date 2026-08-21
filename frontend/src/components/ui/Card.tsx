import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel rounded-xl p-5 shadow-xl relative overflow-hidden',
          hoverEffect && 'glass-panel-hover',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

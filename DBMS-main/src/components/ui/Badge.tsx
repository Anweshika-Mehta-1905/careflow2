import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'hospital';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variants = {
    hospital: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const dots = {
    hospital: 'bg-emerald-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 leading-normal',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[variant]} ${sizes[size]} tracking-wide ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />}
      {children}
    </span>
  );
};


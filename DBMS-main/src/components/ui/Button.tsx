import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    const variants = {
      primary:
        'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow focus-visible:ring-emerald-600 border border-emerald-700/80',
      secondary:
        'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 focus-visible:ring-emerald-500',
      outline:
        'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs focus-visible:ring-emerald-500',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500 border border-rose-600',
      ghost:
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus-visible:ring-slate-400',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-3.5 py-2 gap-2 h-9.5',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';


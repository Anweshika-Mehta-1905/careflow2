import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      children,
      label,
      helperText,
      error,
      leftIcon,
      id,
      required,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            className={`w-full rounded-lg bg-white text-slate-900 border text-sm transition-all duration-150 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9.5' : 'pl-3.5'
            } pr-8 py-2 h-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="20"%20height="20"%20viewBox="0%200%2024%2024"%20fill="none"%20stroke="%2364748b"%20stroke-width="2"%20stroke-linecap="round"%20stroke-linejoin="round"><polyline%20points="6%209%2012%2015%2018%209"></polyline></svg>')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15'
            } ${className}`}
            {...props}
          >
            {children}
          </select>
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';


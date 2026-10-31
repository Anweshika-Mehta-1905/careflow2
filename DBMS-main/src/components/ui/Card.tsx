import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)]',
    muted: 'bg-slate-50/70 border border-slate-200/70',
    outline: 'bg-transparent border border-slate-200',
  };

  return (
    <div
      className={`rounded-xl transition-all duration-150 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 pb-3 sm:p-6 sm:pb-4 border-b border-slate-100/90 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-base sm:text-lg font-semibold text-slate-900 tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs sm:text-sm text-slate-500 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`p-5 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`p-4 sm:px-6 py-3.5 bg-slate-50/50 rounded-b-xl border-t border-slate-100 flex items-center justify-end gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);


import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children,
  badge,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};


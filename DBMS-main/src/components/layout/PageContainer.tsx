import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'default' | 'full' | 'narrow';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  maxWidth = 'default',
}) => {
  const maxWidths = {
    default: 'max-w-7xl',
    full: 'max-w-full',
    narrow: 'max-w-5xl',
  };

  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${maxWidths[maxWidth]} ${className}`}>
      {children}
    </div>
  );
};


import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = '',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <Loader2 className={`${iconSizes[size]} animate-spin text-emerald-600 mb-2`} />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};

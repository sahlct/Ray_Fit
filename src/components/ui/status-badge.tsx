import React from 'react';
import { EvaluationStatus } from '@prisma/client';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: EvaluationStatus | 'MET' | 'NOT_MET' | 'NO_DATA';
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showIcon = true, className, size = 'sm' }: StatusBadgeProps) {
  const isSm = size === 'sm';

  switch (status) {
    case 'MET':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-medium rounded-full badge-met',
            isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
            className
          )}
        >
          {showIcon && <CheckCircle2 className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          Met
        </span>
      );
    case 'NOT_MET':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-medium rounded-full badge-not-met',
            isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
            className
          )}
        >
          {showIcon && <XCircle className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          Not Met
        </span>
      );
    case 'NO_DATA':
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 font-medium rounded-full badge-no-data',
            isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
            className
          )}
        >
          {showIcon && <AlertCircle className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          No Data
        </span>
      );
  }
}

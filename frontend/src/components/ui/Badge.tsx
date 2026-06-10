'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
}

// Severity Badge
interface SeverityBadgeProps extends BadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className, children }) => {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-[4px] border font-display flex items-center justify-center w-fit",
        severity === 'critical' && "bg-critical/15 border-critical/40 text-critical",
        severity === 'high' && "bg-high/15 border-high/40 text-high",
        severity === 'medium' && "bg-medium/15 border-medium/40 text-medium",
        severity === 'low' && "bg-low/15 border-low/40 text-low",
        className
      )}
    >
      {children || severity}
    </span>
  );
};

// Status Badge
interface StatusBadgeProps extends BadgeProps {
  status: 'online' | 'success' | 'pending' | 'error';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, children }) => {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium font-display", className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          (status === 'online' || status === 'success') && "bg-teal-primary shadow-[0_0_8px_#00d4d4]",
          status === 'pending' && "bg-peach shadow-[0_0_8px_#f9b17a]",
          status === 'error' && "bg-critical shadow-[0_0_8px_#ff4d4d]"
        )}
      />
      <span className="text-slate-300 capitalize">{children || status}</span>
    </span>
  );
};

// Tag Chip
export const TagChip: React.FC<BadgeProps> = ({ className, children }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center bg-slate-300/10 border border-slate-300/20 text-[#8b96f9] text-[12px] font-medium font-display px-2.5 py-1 rounded-full",
        className
      )}
    >
      {children}
    </span>
  );
};

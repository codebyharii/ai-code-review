'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        // Base transition and font resets
        "relative flex items-center justify-center font-display font-semibold transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
        
        // Size scales
        size === 'sm' && "px-4 py-2 text-xs rounded-[6px] gap-1.5",
        size === 'md' && "px-6 py-3 text-sm rounded-[10px] gap-2",
        size === 'lg' && "px-8 py-4 text-base rounded-[12px] gap-2.5",
        
        // Variant styling
        variant === 'primary' && [
          "bg-gradient-to-r from-teal-primary to-teal-dark text-[#000000] border border-teal-primary/20",
          "teal-glow teal-glow-hover",
          "hover:brightness-110 hover:-translate-y-[1px]"
        ],
        variant === 'secondary' && [
          "glass-subtle bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/15",
          "backdrop-blur-[8px]"
        ],
        variant === 'danger' && [
          "bg-critical/10 border border-critical/40 text-critical hover:bg-critical/20 hover:border-critical/60"
        ],
        variant === 'icon' && [
          "p-2 w-9 h-9 rounded-md items-center justify-center glass-subtle text-slate-300 hover:text-white hover:bg-white/10"
        ],
        
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : null}
      {!loading && children}
    </button>
  );
};

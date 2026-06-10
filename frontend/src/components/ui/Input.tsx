'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-2 font-display">
        {label && <label className="text-sm font-semibold text-slate-300">{label}</label>}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder-slate-400/60 focus:outline-none focus:border-teal-primary focus:bg-white/8 transition-all duration-200",
            error ? "border-critical focus:border-critical focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "focus:shadow-[0_0_0_3px_rgba(0,212,212,0.20)]",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-critical mt-0.5">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-2 font-display">
        {label && <label className="text-sm font-semibold text-slate-300">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder-slate-400/60 focus:outline-none focus:border-teal-primary focus:bg-white/8 transition-all duration-200 resize-none min-h-[100px]",
            error ? "border-critical focus:border-critical focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "focus:shadow-[0_0_0_3px_rgba(0,212,212,0.20)]",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-critical mt-0.5">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-2 font-display relative">
        {label && <label className="text-sm font-semibold text-slate-300">{label}</label>}
        <div className="relative w-full">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder-slate-400/60 focus:outline-none focus:border-teal-primary focus:bg-white/8 transition-all duration-200 cursor-pointer pr-10",
              error ? "border-critical focus:border-critical focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]" : "focus:shadow-[0_0_0_3px_rgba(0,212,212,0.20)]",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-elevated text-white">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom Teal Chevron */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-teal-primary">
            <svg className="h-4 w-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs text-critical mt-0.5">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

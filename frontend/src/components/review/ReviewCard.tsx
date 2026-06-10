'use client';

import React, { useState } from 'react';
import { ReviewIssue } from '@/types';
import { SeverityBadge } from '../ui/Badge';
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  issue: ReviewIssue;
  onCodeLocate?: (file: string, line: number) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ issue, onCodeLocate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'critical': return 'border-l-critical';
      case 'high': return 'border-l-high';
      case 'medium': return 'border-l-medium';
      case 'low': return 'border-l-low';
    }
  };

  return (
    <div
      className={cn(
        "w-full glass-base bg-white/3 hover:bg-white/5 border-y border-r border-white/5 transition-all duration-200 select-none overflow-hidden my-3 border-l-4",
        getSeverityColor(issue.severity),
        isExpanded ? "shadow-[0_4px_20px_rgba(0,0,0,0.3)] bg-white/6" : "shadow-md"
      )}
    >
      {/* Header Row (Always Visible) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-5 py-4 cursor-pointer gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <SeverityBadge severity={issue.severity} />
          <span className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
            <Code size={13} className="text-teal-primary/80" />
            {issue.file}:{issue.line}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-white/90 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {issue.description.split('.')[0]}.
          </p>
          <span className="text-slate-400 hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-white/5 animate-fade-in-up flex flex-col gap-4">
          
          {/* Issue Details */}
          <div className="flex flex-col gap-1.5 font-display">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Description</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{issue.description}</p>
          </div>

          {/* Snippet Block */}
          {issue.snippet && (
            <div className="flex flex-col gap-1.5 font-mono">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Vulnerable Snippet</h4>
              <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-xs leading-relaxed text-[#e2e8f0] overflow-x-auto whitespace-pre">
                <code>{issue.snippet}</code>
              </div>
            </div>
          )}

          {/* Suggestion Block */}
          <div className="bg-teal-primary/5 border border-teal-primary/20 rounded-xl p-4 flex gap-3">
            <CheckCircle size={18} className="text-teal-primary min-w-[18px] mt-0.5" />
            <div className="flex flex-col gap-1 font-display">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-primary">Recommendation / Solution</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{issue.suggestion}</p>
            </div>
          </div>

          {/* Card Footer Actions */}
          {onCodeLocate && (
            <div className="flex items-center justify-end border-t border-white/5 pt-3 mt-1">
              <button
                onClick={() => onCodeLocate(issue.file, issue.line)}
                className="text-xs font-bold text-teal-primary hover:text-teal-muted flex items-center gap-1.5 cursor-pointer"
              >
                Locate in Code Explorer &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

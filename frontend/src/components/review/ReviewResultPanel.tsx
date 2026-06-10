'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { ReviewCard } from './ReviewCard';
import { SeverityBadge } from '../ui/Badge';
import { Play, ShieldAlert, Sparkles, Terminal, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewResultPanelProps {
  projectId: string;
  onCodeLocate?: (file: string, line: number) => void;
}

export const ReviewResultPanel: React.FC<ReviewResultPanelProps> = ({ projectId, onCodeLocate }) => {
  const { reviews, runReview, activeFile, selectedFiles } = useApp();
  const [reviewType, setReviewType] = useState<'security' | 'performance' | 'quality' | 'custom'>('security');
  const [scope, setScope] = useState<'current' | 'selected' | 'all'>('all');
  const [isRunning, setIsRunning] = useState(false);

  // Filter reviews belonging to this project
  const projectReviews = reviews.filter(r => r.projectId === projectId);
  const latestReview = projectReviews[0]; // Most recent first

  const handleRunReview = async () => {
    setIsRunning(true);
    try {
      await runReview(projectId, reviewType, scope);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const reviewTypeOptions = [
    { value: 'security', label: '🛡️ Security Compliance Audits' },
    { value: 'performance', label: '⚡ Run-time Performance Checks' },
    { value: 'quality', label: '✨ Clean-Code Quality Standards' },
    { value: 'custom', label: '🛠️ Custom Optimization Audits' }
  ];

  const scopeOptions = [
    { value: 'all', label: '📁 Entire Workspace Project' },
    { value: 'current', label: `📄 Active File only (${activeFile?.name || 'None open'})` },
    { value: 'selected', label: `✔️ Selected Folder Files (${selectedFiles.length})` }
  ];

  return (
    <div className="w-full flex flex-col gap-6 font-display">
      {/* Configuration Controls Bar */}
      <div className="glass-base bg-white/3 border border-white/5 rounded-xl p-5 flex flex-col md:flex-row items-end gap-4 shadow-lg">
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Audit Category"
            options={reviewTypeOptions}
            value={reviewType}
            onChange={(e: any) => setReviewType(e.target.value)}
          />
          <Select
            label="Review Scope"
            options={scopeOptions}
            value={scope}
            disabled={scope === 'current' && !activeFile}
            onChange={(e: any) => setScope(e.target.value)}
          />
        </div>
        
        <Button
          variant="primary"
          className="w-full md:w-auto"
          loading={isRunning}
          onClick={handleRunReview}
        >
          <Play size={15} fill="currentColor" />
          Run Review
        </Button>
      </div>

      {/* Loading State Animation */}
      {isRunning && (
        <div className="w-full glass-base flex flex-col items-center justify-center py-16 text-slate-300 gap-4 animate-pulse select-none">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-teal-primary/25 border-t-teal-primary animate-spin" />
            <Terminal size={18} className="absolute inset-0 m-auto text-teal-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold text-white tracking-wide">Auditing Project Codebase...</span>
            <span className="text-xs text-slate-500">Querying active LLM providers to check code constraints.</span>
          </div>
        </div>
      )}

      {/* Results Workspace */}
      {!isRunning && (
        <>
          {latestReview ? (
            <div className="flex flex-col gap-4">
              
              {/* Severity Counts Bar Header */}
              <div className="glass-base bg-white/2 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Latest Audit Report</span>
                  <span className="text-sm text-white font-semibold flex items-center gap-1.5 mt-0.5">
                    <ShieldAlert size={15} className="text-teal-primary" />
                    {latestReview.type.toUpperCase()} check — {latestReview.date}
                  </span>
                </div>
                
                {/* Score Badges */}
                <div className="flex items-center gap-2">
                  <div className="bg-critical/10 border border-critical/20 px-3 py-1.5 rounded-lg text-center min-w-[54px]">
                    <div className="text-xs font-bold text-critical">{latestReview.severitySummary.critical}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Crit</div>
                  </div>
                  <div className="bg-high/10 border border-high/20 px-3 py-1.5 rounded-lg text-center min-w-[54px]">
                    <div className="text-xs font-bold text-high">{latestReview.severitySummary.high}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">High</div>
                  </div>
                  <div className="bg-medium/10 border border-medium/20 px-3 py-1.5 rounded-lg text-center min-w-[54px]">
                    <div className="text-xs font-bold text-medium">{latestReview.severitySummary.medium}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Med</div>
                  </div>
                  <div className="bg-low/10 border border-low/20 px-3 py-1.5 rounded-lg text-center min-w-[54px]">
                    <div className="text-xs font-bold text-low">{latestReview.severitySummary.low}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Low</div>
                  </div>
                </div>
              </div>

              {/* Issues Sorted Card List */}
              <div className="flex flex-col gap-1">
                {latestReview.issues.length > 0 ? (
                  latestReview.issues
                    .sort((a, b) => {
                      const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
                      return severityRank[b.severity] - severityRank[a.severity];
                    })
                    .map((issue) => (
                      <ReviewCard
                        key={issue.id}
                        issue={issue}
                        onCodeLocate={onCodeLocate}
                      />
                    ))
                ) : (
                  <div className="glass-base bg-teal-primary/3 border-teal-primary/20 text-center py-12 flex flex-col items-center gap-3">
                    <Sparkles size={32} className="text-teal-primary" />
                    <h4 className="text-sm font-bold text-white">Clean Bill of Health!</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      No matching issues were found in the scanned files for this code review run.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="w-full glass-base bg-black/10 border border-white/5 rounded-xl py-20 flex flex-col items-center justify-center text-center p-8 select-none">
              <ShieldAlert size={48} className="text-slate-500 mb-4 opacity-50" />
              <h4 className="text-base font-bold text-white">No Reviews Executed Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-6">
                Configure your audit parameters in the control panel above and click "Run Review" to run automatic AI audits on your code.
              </p>
              <Button variant="secondary" onClick={handleRunReview}>
                Run Default Security Review
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

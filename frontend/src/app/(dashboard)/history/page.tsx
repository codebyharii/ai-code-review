'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { ReviewCard } from '@/components/review/ReviewCard';
import {
  History,
  Search,
  Filter,
  Play,
  ChevronDown,
  ChevronUp,
  FileCode,
  ShieldCheck,
  Zap,
  Sparkles,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReviewHistoryPage() {
  const { reviews, reRunReview } = useApp();
  
  // Filter settings
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'security' | 'performance' | 'quality'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [reRunningId, setReRunningId] = useState<string | null>(null);

  const handleReRun = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReRunningId(id);
    try {
      await reRunReview(id);
    } catch (err) {
      console.error(err);
    } finally {
      setReRunningId(null);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(rev => {
      const matchesSearch = 
        rev.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.issues.some(i => i.file.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || rev.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [reviews, searchQuery, typeFilter]);

  const typeFilterOptions = [
    { value: 'all', label: '🔍 All Categories' },
    { value: 'security', label: '🛡️ Security Compliance' },
    { value: 'performance', label: '⚡ Performance' },
    { value: 'quality', label: '✨ Clean Quality' }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up font-display pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <History className="text-teal-primary" />
          Review History Log
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Access and filter archived AI code reviews and severity reports
        </p>
      </div>

      {/* Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Input
            placeholder="Search logs by project name or file path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
        </div>
        
        <Select
          options={typeFilterOptions}
          value={typeFilter}
          onChange={(e: any) => setTypeFilter(e.target.value)}
        />
      </div>

      {/* History List Table */}
      <div className="glass-base bg-white/2 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/6 bg-black/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Audit Category</th>
                <th className="px-6 py-4">Vulnerability Totals</th>
                <th className="px-6 py-4">Date Run</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((rev) => {
                  const isRowExpanded = expandedRow === rev.id;
                  const isCurrentReRunning = reRunningId === rev.id;

                  return (
                    <React.Fragment key={rev.id}>
                      {/* Base Row */}
                      <tr
                        onClick={() => toggleRow(rev.id)}
                        className={cn(
                          "hover:bg-white/4 cursor-pointer transition-all duration-150 select-none",
                          isRowExpanded && "bg-white/4"
                        )}
                      >
                        <td className="px-6 py-4 text-slate-500">
                          {isRowExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="px-6 py-4 font-bold text-white flex items-center gap-2 mt-1">
                          <FileCode size={14} className="text-teal-primary/60" />
                          {rev.projectName}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize font-semibold border border-white/10 px-2 py-0.5 rounded text-[10px] bg-white/5">
                            {rev.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-mono font-medium">
                            <span className="text-critical">{rev.severitySummary.critical}C</span>
                            <span>•</span>
                            <span className="text-high">{rev.severitySummary.high}H</span>
                            <span>•</span>
                            <span className="text-medium">{rev.severitySummary.medium}M</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono">{rev.date}</td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={isCurrentReRunning}
                            onClick={(e) => handleReRun(rev.id, e)}
                          >
                            <Play size={10} fill="currentColor" />
                            Re-run
                          </Button>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isRowExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-black/25 px-6 py-6 border-b border-white/5 select-text">
                            <div className="flex flex-col gap-6 animate-fade-in-up">
                              {/* Summary Header */}
                              <div className="flex flex-col gap-1 border-l-2 border-teal-primary pl-4">
                                <h4 className="text-sm font-bold text-white font-display">Report Summary Detail</h4>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                  AI Code Review isolated {rev.issues.length} matching code issues in this repository during this evaluation cycle. Review specific remediation blocks below.
                                </p>
                              </div>

                              {/* Nested Issues list */}
                              <div className="space-y-4">
                                {rev.issues.map((iss) => (
                                  <div key={iss.id} className="border border-white/5 rounded-lg p-4 bg-white/1 flex flex-col gap-2 font-display">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                      <SeverityBadge severity={iss.severity} />
                                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{iss.file}:{iss.line}</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">{iss.description}</p>
                                    
                                    {iss.snippet && (
                                      <pre className="bg-black/50 border border-white/5 p-2.5 rounded text-[11px] font-mono text-[#e2e8f0] overflow-x-auto whitespace-pre mt-1">
                                        <code>{iss.snippet}</code>
                                      </pre>
                                    )}

                                    <div className="bg-teal-primary/4 border border-teal-primary/10 rounded-lg p-3 text-[11px] text-slate-300 mt-1 flex gap-2">
                                      <Sparkles size={14} className="text-teal-primary shrink-0 mt-0.5" />
                                      <span>{iss.suggestion}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-500">
                    No matching review reports located.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

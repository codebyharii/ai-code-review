'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  FolderGit2,
  ShieldCheck,
  Bug,
  BrainCircuit,
  Play,
  Upload,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const { projects, reviews, providers } = useApp();
  const router = useRouter();

  // Metrics calculators
  const totalProjects = projects.length;
  const reviewsRun = reviews.length;
  
  const totalIssues = reviews.reduce((sum, rev) => {
    return sum + (rev.severitySummary.critical + rev.severitySummary.high + rev.severitySummary.medium + rev.severitySummary.low);
  }, 0);
  
  const activeModels = providers.filter(p => p.active).length;

  const recentReviews = reviews.slice(0, 5);

  const stats = [
    { label: 'Total Projects', value: totalProjects, icon: FolderGit2, change: 'Active workspace' },
    { label: 'Reviews Run', value: reviewsRun, icon: ShieldCheck, change: '+12% this week' },
    { label: 'Issues Isolated', value: totalIssues, icon: Bug, change: '12 unresolved' },
    { label: 'Active LLM Models', value: activeModels, icon: BrainCircuit, change: 'Optimized speed' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">Workspace Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time insights and vulnerability statistics for your projects
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => router.push('/projects')}>
            <Upload size={16} />
            Upload Code
          </Button>
          <Button variant="primary" onClick={() => router.push('/reviews')}>
            <Play size={16} fill="currentColor" />
            Start Audit
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="glass-base bg-white/3 hover:bg-white/6 hover:shadow-[0_0_20px_rgba(0,212,212,0.1)] transition-all duration-300 p-6 flex flex-col relative overflow-hidden group"
            >
              {/* Background Glow */}
              <div className="absolute right-[-10%] top-[-10%] w-24 h-24 rounded-full bg-teal-primary/5 blur-xl group-hover:bg-teal-primary/10 transition-all" />
              
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-teal-primary/10 border border-teal-primary/20 text-teal-primary flex items-center justify-center shadow-sm">
                  <Icon size={16} />
                </div>
              </div>
              
              <div className="text-3xl font-bold text-white mt-4 font-mono">
                {stat.value}
              </div>
              
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-2">
                <TrendingUp size={12} className="text-teal-primary/70" />
                <span>{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity (Col-span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-white tracking-wide font-display">Recent Activity Log</h2>
            <button
              onClick={() => router.push('/reviews')}
              className="text-xs text-teal-primary hover:text-teal-muted font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              View History
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="glass-base bg-white/2 border border-white/5 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/6 bg-black/30 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Review Mode</th>
                    <th className="px-6 py-4">Vulnerability Count</th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {recentReviews.length > 0 ? (
                    recentReviews.map((rev) => (
                      <tr
                        key={rev.id}
                        onClick={() => router.push(`/projects/${rev.projectId}`)}
                        className="hover:bg-white/4 cursor-pointer transition-all duration-150"
                      >
                        <td className="px-6 py-4 font-semibold text-white">{rev.projectName}</td>
                        <td className="px-6 py-4">
                          <span className="capitalize bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px]">
                            {rev.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-medium">
                          <div className="flex items-center gap-2">
                            {rev.severitySummary.critical > 0 && (
                              <span className="text-critical">{rev.severitySummary.critical}C</span>
                            )}
                            {rev.severitySummary.high > 0 && (
                              <span className="text-high">{rev.severitySummary.high}H</span>
                            )}
                            {rev.severitySummary.medium > 0 && (
                              <span className="text-medium">{rev.severitySummary.medium}M</span>
                            )}
                            {rev.severitySummary.critical === 0 && rev.severitySummary.high === 0 && rev.severitySummary.medium === 0 && (
                              <span className="text-teal-primary">Clean</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{rev.date}</td>
                        <td className="px-6 py-4 text-right">
                          <StatusBadge status={rev.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-500">
                        No code audits recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Audits Panel (Col-span 1) */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-white tracking-wide font-display px-1">Active Projects</h2>
          
          <div className="glass-base bg-white/2 border border-white/5 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => router.push(`/projects/${proj.id}`)}
                    className="group flex items-center justify-between p-3.5 rounded-lg border border-white/5 bg-white/2 hover:bg-teal-primary/5 hover:border-teal-primary/20 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-teal-primary/10 text-slate-400 group-hover:text-teal-primary border border-white/10 group-hover:border-teal-primary/30 flex items-center justify-center transition-colors">
                        <FolderGit2 size={15} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white truncate">{proj.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{proj.fileCount} source files</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-500 group-hover:text-teal-primary group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500">
                No active projects in workspace.
              </div>
            )}
            
            <Button
              variant="secondary"
              onClick={() => router.push('/projects')}
              className="w-full mt-2"
            >
              Manage Projects
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

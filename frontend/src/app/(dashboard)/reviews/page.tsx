'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Select } from '@/components/ui/Input';
import { ReviewResultPanel } from '@/components/review/ReviewResultPanel';
import { ShieldAlert, ArrowRight, Play, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ReviewsLauncherPage() {
  const { projects, activeProjectId, setActiveProjectId } = useApp();
  const [selectedProjId, setSelectedProjId] = useState('');

  // Sync selected project with active workspace context
  useEffect(() => {
    if (activeProjectId) {
      setSelectedProjId(activeProjectId);
    } else if (projects.length > 0) {
      setSelectedProjId(projects[0].id);
      setActiveProjectId(projects[0].id);
    }
  }, [activeProjectId, projects, setActiveProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjId(e.target.value);
    setActiveProjectId(e.target.value);
  };

  const projectOptions = projects.map(p => ({
    value: p.id,
    label: `📁 ${p.name} (${p.fileCount} files)`
  }));

  return (
    <div className="space-y-8 animate-fade-in-up font-display">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">AI Code Reviewer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Trigger automated code reviews using pre-configured LLM provider nodes
          </p>
        </div>
        
        <Link href="/history">
          <Button variant="secondary">
            View History Reports
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>

      {/* Launcher Area */}
      {projects.length > 0 ? (
        <div className="flex flex-col gap-6">
          {/* Project selector dropdown */}
          <div className="glass-base bg-white/2 border border-white/5 rounded-xl p-5 max-w-md">
            <Select
              label="Select Project to Audit"
              options={projectOptions}
              value={selectedProjId}
              onChange={handleProjectChange}
            />
          </div>

          {/* Scoped Result Panel */}
          {selectedProjId && (
            <div className="border-t border-white/5 pt-6">
              <ReviewResultPanel projectId={selectedProjId} />
            </div>
          )}
        </div>
      ) : (
        // Empty State
        <div className="glass-base bg-black/10 border border-white/5 rounded-2xl py-24 flex flex-col items-center justify-center text-center p-8 select-none">
          <ShieldAlert size={56} className="text-slate-500 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white">No Projects Available</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
            You need to create a project and upload source files before triggering code reviews.
          </p>
          <Link href="/projects">
            <Button variant="primary">
              Go to Projects
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

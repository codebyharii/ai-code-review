'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { FileTree } from '@/components/code/FileTree';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Select } from '@/components/ui/Input';
import { MessageSquareCode, ShieldAlert, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeFile,
    setActiveFile,
    selectedFiles,
    setSelectedFiles
  } = useApp();

  const [selectedProjId, setSelectedProjId] = useState('');
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);

  // Sync selected project with active context state
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

  const currentProject = projects.find(p => p.id === selectedProjId);

  const projectOptions = projects.map(p => ({
    value: p.id,
    label: `📁 ${p.name} (${p.fileCount} files)`
  }));

  const handleFileSelect = (file: any) => {
    setActiveFile(file);
  };

  const handleFileToggle = (path: string) => {
    setSelectedFiles(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-display pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <MessageSquareCode className="text-teal-primary animate-pulse" />
            AI Developer Copilot
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Chat interactively with AI to optimize, explain, or fix vulnerabilities in files
          </p>
        </div>
        
        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="w-full sm:w-64">
            <Select
              options={projectOptions}
              value={selectedProjId}
              onChange={handleProjectChange}
            />
          </div>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* LEFT: Collapsible File Tree (240px) */}
          <div
            className={cn(
              "glass-base bg-white/2 border border-white/5 rounded-xl p-4 transition-all duration-300 w-full lg:w-fit shrink-0",
              isFileTreeCollapsed ? "lg:w-14 overflow-hidden" : "lg:w-[260px]"
            )}
          >
            <div className="flex items-center justify-between px-1 mb-3">
              {!isFileTreeCollapsed && (
                <span className="text-xs font-bold text-white uppercase tracking-wider">Project Scope</span>
              )}
              <button
                onClick={() => setIsFileTreeCollapsed(!isFileTreeCollapsed)}
                className="hidden lg:flex p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title={isFileTreeCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {isFileTreeCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>

            {!isFileTreeCollapsed && currentProject && (
              <FileTree
                files={currentProject.files}
                activeFile={activeFile}
                selectedFiles={selectedFiles}
                onFileSelect={handleFileSelect}
                onFileToggleSelect={handleFileToggle}
                showCheckboxes={true}
              />
            )}
            
            {isFileTreeCollapsed && (
              <div className="hidden lg:flex flex-col items-center gap-4 py-6 text-slate-500">
                <FileText size={18} />
              </div>
            )}
          </div>

          {/* RIGHT: Chat Copilot Interface */}
          <div className="flex-1 w-full">
            {selectedProjId && (
              <ChatWindow
                projectId={selectedProjId}
                onFileLinkClick={(path) => {
                  const matchedFile = currentProject?.files.find(f => f.path === path);
                  if (matchedFile) handleFileSelect(matchedFile);
                }}
              />
            )}
          </div>
        </div>
      ) : (
        // Empty State
        <div className="glass-base bg-black/10 border border-white/5 rounded-2xl py-24 flex flex-col items-center justify-center text-center p-8 select-none">
          <ShieldAlert size={56} className="text-slate-500 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white">No Projects Active</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
            Please create a project and upload codebase files first before engaging AI chatbots.
          </p>
        </div>
      )}
    </div>
  );
}

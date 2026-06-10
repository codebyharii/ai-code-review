'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { FileTree } from '@/components/code/FileTree';
import { CodePreview } from '@/components/code/CodePreview';
import { ReviewResultPanel } from '@/components/review/ReviewResultPanel';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FileUploadZone } from '@/components/code/FileUploadZone';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Terminal,
  Code2,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Upload,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { ProjectFile } from '@/types';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const {
    projects,
    activeFile,
    setActiveFile,
    activeProjectId,
    setActiveProjectId,
    selectedFiles,
    setSelectedFiles,
    generateDocs
  } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'preview' | 'review' | 'chat'>('preview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<string | null>(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isDocsCopied, setIsDocsCopied] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Retrieve current project
  const currentProject = projects.find(p => p.id === id);

  const handleGenerateDocs = async () => {
    if (!currentProject) return;
    setIsGeneratingDocs(true);
    setDocsError(null);
    setGeneratedDocs(null);
    setIsDocsModalOpen(true);
    try {
      const docs = await generateDocs(currentProject.id);
      setGeneratedDocs(docs);
    } catch (err: any) {
      setDocsError(err.message || 'Failed to generate documentation.');
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  const handleCopyDocs = () => {
    if (!generatedDocs) return;
    navigator.clipboard.writeText(generatedDocs);
    setIsDocsCopied(true);
    setTimeout(() => setIsDocsCopied(false), 2000);
  };

  // Set active project context on load
  useEffect(() => {
    if (currentProject) {
      setActiveProjectId(currentProject.id);
      
      // Auto-open first file if no active file is loaded
      if (currentProject.files.length > 0 && (!activeFile || !currentProject.files.some(f => f.path === activeFile.path))) {
        setActiveFile(currentProject.files[0]);
      }
    }
  }, [id, currentProject, setActiveProjectId, setActiveFile, activeFile]);

  // If project is not found, render error state
  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-display gap-4">
        <ShieldAlert size={48} className="text-critical animate-pulse" />
        <h3 className="text-lg font-bold text-white">Project Not Located</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          The requested project ID may have been deleted or does not exist in this workspace session.
        </p>
        <Button variant="secondary" onClick={() => router.push('/projects')}>
          Return to Projects
        </Button>
      </div>
    );
  }

  const handleFileSelect = (file: ProjectFile) => {
    setActiveFile(file);
    // Auto shift to preview tab
    setActiveTab('preview');
  };

  const handleFileToggle = (path: string) => {
    setSelectedFiles(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const handleFilesUploaded = (newFiles: ProjectFile[]) => {
    // Merge new files into project simulation
    currentProject.files = [...currentProject.files, ...newFiles];
    currentProject.fileCount = currentProject.files.length;
    setIsUploadModalOpen(false);
    
    // Auto select first uploaded file
    if (newFiles.length > 0) {
      setActiveFile(newFiles[0]);
    }
  };

  const handleCodeLocate = (filePath: string, line: number) => {
    const file = currentProject.files.find(f => f.path === filePath);
    if (file) {
      setActiveFile(file);
      setActiveTab('preview');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-display pb-10">
      
      {/* Breadcrumb Header row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 select-none">
            <button
              onClick={() => router.push('/projects')}
              className="hover:text-teal-primary transition-colors cursor-pointer"
            >
              Projects
            </button>
            <ChevronRight size={12} />
            <span className="text-slate-300 truncate max-w-[150px]">{currentProject.name}</span>
          </div>
          
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
            <button
              onClick={() => router.push('/projects')}
              className="p-1 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer mr-1 transition-all"
            >
              <ArrowLeft size={16} />
            </button>
            {currentProject.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleGenerateDocs} className="gap-1.5 hover:text-teal-primary transition-all">
            <Sparkles size={14} className="text-teal-primary" />
            Generate README
          </Button>
          
          <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)}>
            <Upload size={15} />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Panel: File Explorer (35%) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-base bg-white/2 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Workspace Files</h3>
              <span className="text-[10px] text-slate-500 font-bold font-mono bg-white/5 px-2 py-0.5 rounded">
                TS/JS/PY
              </span>
            </div>
            
            <FileTree
              files={currentProject.files}
              activeFile={activeFile}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onFileToggleSelect={handleFileToggle}
              showCheckboxes={true}
            />
            
            <div className="text-[10px] text-slate-500 leading-normal px-1">
              💡 Tips: Tick the checkboxes to define custom review file scopes.
            </div>
          </div>
        </div>

        {/* Right Panel: Workspace Tabs & Content (65%) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Tab Navigation header */}
          <div className="flex items-center gap-2 border-b border-white/6 px-1">
            {[
              { id: 'preview', label: 'Preview Code', icon: Code2 },
              { id: 'review', label: 'Run AI Review', icon: ShieldCheck },
              { id: 'chat', label: 'Ask Copilot', icon: MessageSquare }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer relative",
                    activeTab === tab.id
                      ? "border-teal-primary text-teal-primary font-extrabold"
                      : "border-transparent text-slate-400 hover:text-white"
                  )}
                >
                  <TabIcon size={16} />
                  {tab.label}
                  {tab.id === 'review' && currentProject.fileCount > 0 && (
                    <span className="absolute -top-1.5 -right-1 bg-gradient-to-r from-teal-primary to-teal-dark text-[8px] text-white px-1 py-0.2 rounded-full scale-90 border border-teal-primary/20 shadow animate-pulse">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="w-full">
            {activeTab === 'preview' && (
              <CodePreview file={activeFile} />
            )}
            
            {activeTab === 'review' && (
              <ReviewResultPanel
                projectId={currentProject.id}
                onCodeLocate={handleCodeLocate}
              />
            )}
            
            {activeTab === 'chat' && (
              <ChatWindow
                projectId={currentProject.id}
                onFileLinkClick={(path) => handleCodeLocate(path, 1)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Upload Files Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Add files to project"
        footer={
          <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <FileUploadZone onFilesUploaded={handleFilesUploaded} />
        </div>
      </Modal>

      {/* Documentation Generation Modal */}
      {isDocsModalOpen && (
        <Modal
          isOpen={isDocsModalOpen}
          onClose={() => setIsDocsModalOpen(false)}
          title={`AI README & Setup Guide: ${currentProject.name}`}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              {generatedDocs && (
                <button
                  onClick={handleCopyDocs}
                  className="px-4 py-2 text-xs font-bold text-teal-primary border border-teal-primary/25 bg-teal-primary/10 hover:bg-teal-primary/15 rounded-lg flex items-center gap-1.5 cursor-pointer font-display transition-all"
                >
                  {isDocsCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isDocsCopied ? 'Copied!' : 'Copy Markdown'}
                </button>
              )}
              <button
                onClick={() => setIsDocsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 border border-white/5 bg-white/2 hover:bg-white/5 rounded-lg cursor-pointer font-display transition-all"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 max-h-[450px] overflow-y-auto font-display text-sm text-slate-300">
            {isGeneratingDocs ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3 select-none">
                <Loader2 className="w-8 h-8 text-teal-primary animate-spin" />
                <span className="text-sm font-semibold text-slate-300">Generating Documentation Guide...</span>
                <span className="text-[10px] text-slate-500 max-w-xs leading-normal">
                  Our LLM is analyzing files list, structure hierarchies, and mapping setup directions.
                </span>
              </div>
            ) : docsError ? (
              <div className="text-critical bg-critical/10 border border-critical/20 p-4 rounded-lg flex items-center gap-2">
                <span>⚠️ {docsError}</span>
              </div>
            ) : (
              <pre className="bg-black/45 border border-white/5 rounded-xl p-4 leading-relaxed whitespace-pre-wrap select-text overflow-x-auto text-[#e2e8f0] font-mono text-xs">
                <code>{generatedDocs}</code>
              </pre>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

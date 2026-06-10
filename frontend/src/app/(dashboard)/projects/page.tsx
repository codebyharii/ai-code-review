'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TagChip } from '@/components/ui/Badge';
import { FileUploadZone } from '@/components/code/FileUploadZone';
import { cn } from '@/lib/utils';
import {
  FolderGit2,
  Search,
  Plus,
  Trash2,
  Clock,
  Code2,
  FolderOpen,
  ArrowUpDown
} from 'lucide-react';
import { ProjectFile } from '@/types';

export default function ProjectsPage() {
  const { projects, addProject, deleteProject } = useApp();
  const router = useRouter();

  // Search & sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'files'>('date');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [rawUploadedFiles, setRawUploadedFiles] = useState<File[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleFilesUploaded = (files: ProjectFile[], rawFiles?: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    if (rawFiles) {
      setRawUploadedFiles(prev => [...prev, ...rawFiles]);
    }
  };

  const handleCreateProject = async () => {
    setModalError(null);
    if (!newProjName.trim()) {
      setModalError("Please specify a project name.");
      return;
    }
    
    // Inject a default config file if they didn't upload any file
    let filesToSave = rawUploadedFiles;
    if (filesToSave.length === 0) {
      const defaultCode = '// Default entry point\nconsole.log("Welcome to your project!");';
      const defaultBlob = new Blob([defaultCode], { type: 'text/plain' });
      const defaultFile = new File([defaultBlob], 'index.js', { type: 'text/plain' });
      filesToSave = [defaultFile];
    }

    try {
      const newId = await addProject(newProjName, newProjDesc, filesToSave);
      
      // Reset Form
      setNewProjName('');
      setNewProjDesc('');
      setUploadedFiles([]);
      setRawUploadedFiles([]);
      setIsModalOpen(false);
      
      router.push(`/projects/${newId}`);
    } catch (err: any) {
      setModalError(err.message || "Failed to create project.");
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? This will erase all audit logs.")) {
      deleteProject(id);
    }
  };

  // Filter & Sort computation
  const filteredAndSorted = useMemo(() => {
    let list = projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    list.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'files') {
        return b.fileCount - a.fileCount;
      }
      // Default: date (newest first, simulating by ID sort)
      return b.id.localeCompare(a.id);
    });

    return list;
  }, [projects, searchQuery, sortBy]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">Workspace Projects</h1>
          <p className="text-sm text-slate-400 mt-1">
            Create, manage, and audit your static source code repositories
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Input
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3.5 bottom-3.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Sort Presets */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 select-none">
          <ArrowUpDown size={14} className="text-teal-primary/70 mr-1" />
          <span className="text-xs font-semibold text-slate-400">Sort:</span>
          {['date', 'name', 'files'].map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option as any)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer border transition-all",
                sortBy === option
                  ? "bg-teal-primary/15 border-teal-primary text-teal-primary"
                  : "border-white/5 bg-white/2 hover:bg-white/5 text-slate-400"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredAndSorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSorted.map((proj) => (
            <div
              key={proj.id}
              onClick={() => router.push(`/projects/${proj.id}`)}
              className="glass-base bg-white/3 hover:bg-white/6 hover:shadow-[0_0_24px_rgba(0,212,212,0.15)] hover:-translate-y-1 p-6 flex flex-col justify-between min-h-[180px] cursor-pointer transition-all duration-300 group relative"
            >
              <div>
                {/* Card Top Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-primary/10 border border-teal-primary/20 text-teal-primary flex items-center justify-center transition-all duration-300 shadow-sm group-hover:scale-105">
                    <FolderGit2 size={18} />
                  </div>
                  
                  <button
                    onClick={(e) => handleDelete(proj.id, e)}
                    className="p-1.5 rounded-md hover:bg-critical/15 text-slate-500 hover:text-critical transition-all cursor-pointer z-10"
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Info Text */}
                <h3 className="text-base font-bold text-white tracking-wide group-hover:text-teal-primary transition-colors">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-300/60 leading-relaxed mt-1.5 line-clamp-2">
                  {proj.description || "No project description provided."}
                </p>
              </div>

              {/* Bottom Metadata row */}
              <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-6">
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                  <Clock size={11} />
                  {proj.createdAt}
                </span>
                
                <span className="text-[10px] bg-slate-300/10 border border-slate-300/20 text-[#8b96f9] font-bold font-mono px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                  <Code2 size={11} />
                  {proj.fileCount} files
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="glass-base bg-black/10 border border-white/5 rounded-2xl py-24 flex flex-col items-center justify-center text-center p-8 select-none">
          <FolderOpen size={56} className="text-slate-500 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
            Create your first workspace project to start checking your file directories for security and runtime loopholes.
          </p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Create First Project
          </Button>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUploadedFiles([]);
          setModalError(null);
        }}
        title="Create New Project"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setUploadedFiles([]);
                setModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProject}>
              Create Project
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-display">
          <Input
            label="Project Name"
            placeholder="e.g. user-auth-microservice"
            value={newProjName}
            onChange={(e) => setNewProjName(e.target.value)}
            error={modalError || undefined}
          />
          
          <Textarea
            label="Description"
            placeholder="Enter a brief description of what this microservice does..."
            value={newProjDesc}
            onChange={(e) => setNewProjDesc(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-300">Upload Source Files</span>
            <FileUploadZone onFilesUploaded={handleFilesUploaded} />
            
            {/* Uploaded Files Preview List */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 bg-black/30 border border-white/5 p-3 rounded-lg max-h-[120px] overflow-y-auto">
                {uploadedFiles.map((f, idx) => (
                  <TagChip key={idx} className="font-mono text-[10px] py-0.5 px-2">
                    {f.name}
                  </TagChip>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

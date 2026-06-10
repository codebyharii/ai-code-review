'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectFile } from '@/types';

interface FileUploadZoneProps {
  onFilesUploaded: (files: ProjectFile[], rawFiles?: File[]) => void;
  className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFilesUploaded, className }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);

    const loadedFiles: ProjectFile[] = [];
    const rawFiles: File[] = [];
    const readPromises: Promise<void>[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      rawFiles.push(file);
      
      // Basic size validation (limit to 5MB for zips/code files)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 5MB limit.`);
        return;
      }

      const ext = file.name.split('.').pop() || '';
      const isZip = ext.toLowerCase() === 'zip';
      const allowedExtensions = ['zip', 'ts', 'tsx', 'js', 'jsx', 'py', 'css', 'scss', 'json', 'md', 'sql', 'html', 'java', 'go', 'yml', 'yaml', 'c', 'cpp', 'rs'];
      
      if (!allowedExtensions.includes(ext.toLowerCase())) {
        setError(`File "${file.name}" type not officially supported. Uploading anyway.`);
      }

      const promise = new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          loadedFiles.push({
            name: file.name,
            path: file.name,
            language: ext,
            content: isZip ? '[Binary Archive]' : (e.target?.result as string || '')
          });
          resolve();
        };
        reader.onerror = () => {
          setError(`Error reading file "${file.name}"`);
          resolve();
        };
        if (isZip) {
          resolve();
        } else {
          reader.readAsText(file);
        }
      });
      readPromises.push(promise);
    }

    await Promise.all(readPromises);
    if (loadedFiles.length > 0) {
      onFilesUploaded(loadedFiles, rawFiles);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full flex flex-col gap-2 font-display", className)}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={cn(
          "w-full flex flex-col items-center justify-center border-2 border-dashed border-teal-primary/30 bg-teal-primary/4 hover:bg-teal-primary/8 hover:border-teal-primary hover:shadow-[0_0_24px_rgba(0,212,212,0.2)] rounded-xl p-8 text-center cursor-pointer transition-all duration-300 select-none group min-h-[180px]",
          isDragActive && "border-teal-primary bg-teal-primary/8 shadow-[0_0_24px_rgba(0,212,212,0.25)]"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <UploadCloud 
          size={36} 
          className="text-teal-primary/70 group-hover:text-teal-primary group-hover:scale-110 transition-all duration-300 mb-3" 
        />
        
        <p className="text-sm font-semibold text-white tracking-wide">
          Drag & drop code files here, or <span className="text-teal-primary underline group-hover:brightness-110">browse files</span>
        </p>
        <p className="text-xs text-slate-300/60 mt-1.5">
          Supports TS, JS, PY, JAVA, GO, CSS, HTML, YAML up to 1MB
        </p>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-xs text-[#f9b17a] bg-[#f9b17a]/10 border border-[#f9b17a]/20 p-2.5 rounded-lg mt-1">
          <AlertCircle size={14} className="min-w-[14px]" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileCode, ChevronDown, ChevronRight, FileJson, FileText, Check } from 'lucide-react';
import { ProjectFile } from '@/types';
import { cn } from '@/lib/utils';

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: ProjectFile;
}

interface FileTreeProps {
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  selectedFiles?: string[];
  onFileSelect: (file: ProjectFile) => void;
  onFileToggleSelect?: (path: string) => void;
  showCheckboxes?: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFile,
  selectedFiles = [],
  onFileSelect,
  onFileToggleSelect,
  showCheckboxes = false
}) => {
  const [expandedFolders, setExpandedFolders] = useState<{ [path: string]: boolean }>({
    'src': true,
    '': true
  });

  // Convert list of files to a nested tree structure
  const tree = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = root;
      let currentPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = i === parts.length - 1;
        
        let found = current.children.find(child => child.name === part);
        if (!found) {
          found = {
            name: part,
            path: currentPath,
            isFolder: !isLast,
            children: [],
            file: isLast ? file : undefined
          };
          current.children.push(found);
        }
        current = found;
      }
    });

    // Sort folders first, then files alphabetically
    const sortTree = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortTree);
    };

    sortTree(root);
    return root.children;
  }, [files]);

  const toggleFolder = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getFileIconColor = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'text-[#3178c6]'; // TS blue
      case 'js':
      case 'jsx':
        return 'text-[#f7df1e]'; // JS yellow
      case 'py':
        return 'text-[#3572a5]'; // Python green
      case 'css':
      case 'scss':
        return 'text-[#cf649a]'; // Style pink
      case 'json':
        return 'text-[#f9b17a]'; // JSON orange
      case 'md':
        return 'text-[#6b76d9]'; // MD slate-indigo
      case 'sql':
        return 'text-[#00d4d4]'; // SQL teal
      case 'java':
        return 'text-[#b07219]'; // Java brown
      case 'yml':
      case 'yaml':
        return 'text-[#e24a35]'; // YAML red
      default:
        return 'text-slate-400';
    }
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expandedFolders[node.path];
    const isFileActive = activeFile && activeFile.path === node.path;
    const isFileChecked = selectedFiles.includes(node.path);

    if (node.isFolder) {
      return (
        <div key={node.path} className="flex flex-col select-none">
          <div
            onClick={(e) => toggleFolder(node.path, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/4 rounded-[6px] cursor-pointer text-xs font-semibold text-slate-300 transition-all font-display"
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
          >
            <span className="text-slate-500 hover:text-white transition-colors">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            {isExpanded ? (
              <FolderOpen size={16} className="text-teal-primary" />
            ) : (
              <Folder size={16} className="text-slate-400" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          
          {isExpanded && (
            <div className="flex flex-col">
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div
          key={node.path}
          onClick={() => node.file && onFileSelect(node.file)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 hover:bg-white/4 rounded-[6px] cursor-pointer text-xs text-slate-300 transition-all border-l-2 border-transparent font-display",
            isFileActive && "bg-white/6 border-teal-primary text-white font-medium",
            showCheckboxes && "pr-8 relative"
          )}
          style={{ paddingLeft: `${depth * 12 + 28}px` }}
        >
          {showCheckboxes && onFileToggleSelect && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onFileToggleSelect(node.path);
              }}
              className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center mr-1 transition-all",
                isFileChecked
                  ? "border-teal-primary bg-teal-primary/20 text-teal-primary shadow-[0_0_8px_rgba(0,212,212,0.3)]"
                  : "border-white/20 hover:border-white/40"
              )}
            >
              {isFileChecked && <Check size={10} strokeWidth={3} />}
            </div>
          )}
          
          <FileCode size={15} className={getFileIconColor(node.name)} />
          <span className="truncate flex-1">{node.name}</span>
        </div>
      );
    }
  };

  return (
    <div className="w-full flex flex-col font-display bg-white/2 border border-white/5 rounded-xl p-3 min-h-[220px] max-h-[400px] overflow-y-auto">
      <div className="text-[10px] font-bold tracking-wider text-slate-400/60 uppercase mb-2 px-3 flex items-center justify-between">
        <span>Files Explorer</span>
        <span>{files.length} items</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {tree.length > 0 ? (
          tree.map(node => renderNode(node, 0))
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            No files in project tree.
          </div>
        )}
      </div>
    </div>
  );
};

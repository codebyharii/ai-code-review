'use client';

import React, { useMemo, useState } from 'react';
import { ProjectFile } from '@/types';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';

interface CodePreviewProps {
  file: ProjectFile | null;
  className?: string;
}

export const CodePreview: React.FC<CodePreviewProps> = ({ file, className }) => {
  const { generateTests } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTests = async () => {
    if (!file || !file.id) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedTests(null);
    setIsModalOpen(true);
    try {
      const tests = await generateTests(file.id);
      setGeneratedTests(tests);
    } catch (err: any) {
      setError(err.message || 'Failed to generate unit tests.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedTests) return;
    navigator.clipboard.writeText(generatedTests);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Simple regex-based syntax highlighter for frontend representation
  const highlightCode = (content: string, ext: string): string[] => {
    const lines = content.split('\n');
    
    return lines.map((line) => {
      if (!line.trim()) return '&nbsp;';
      
      let highlighted = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // 1. Comments
      const isPythonOrYaml = ext === 'py' || ext === 'yml' || ext === 'yaml';
      const commentRegex = isPythonOrYaml ? /(#.*)$/ : /(\/\/.*)$/;
      let commentMatch = highlighted.match(commentRegex);
      let commentPlaceholder = '';
      
      if (commentMatch) {
        commentPlaceholder = `__COMMENT_PLACEHOLDER_${Date.now()}__`;
        highlighted = highlighted.replace(commentMatch[0], commentPlaceholder);
      }
      
      // 2. Strings
      const stringRegexes = [/"([^"\\]|\\.)*"/g, /'([^'\\]|\\.)*'/g, /`([^`\\]|\\.)*`/g];
      const stringPlaceholders: string[] = [];
      
      stringRegexes.forEach((regex, idx) => {
        highlighted = highlighted.replace(regex, (match) => {
          const ph = `__STRING_PLACEHOLDER_${idx}_${stringPlaceholders.length}_${Date.now()}__`;
          stringPlaceholders.push(match);
          return ph;
        });
      });

      // 3. Keywords
      const jsKeywords = /\b(const|let|var|function|return|import|export|from|default|class|extends|new|this|async|await|try|catch|finally|if|else|for|while|do|switch|case|break|continue|throw|typeof|instanceof)\b/g;
      const pyKeywords = /\b(def|class|return|import|from|as|if|elif|else|for|while|in|is|not|and|or|try|except|finally|raise|with|lambda|pass|print)\b/g;
      const keywords = ext === 'py' ? pyKeywords : jsKeywords;
      
      highlighted = highlighted.replace(keywords, '<span class="token-keyword">$1</span>');

      // 4. Functions
      highlighted = highlighted.replace(/\b([a-zA-Z_]\w*)(?=\s*\()/g, '<span class="token-function">$1</span>');

      // 5. Numbers
      highlighted = highlighted.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="token-number">$1</span>');

      // Restore Strings
      stringPlaceholders.forEach((str, idx) => {
        const phRegex = new RegExp(`__STRING_PLACEHOLDER_\\d+_${idx}_\\d+__`);
        highlighted = highlighted.replace(phRegex, `<span class="token-string">${str}</span>`);
      });

      // Restore Comments
      if (commentMatch) {
        highlighted = highlighted.replace(commentPlaceholder, `<span class="token-comment">${commentMatch[0]}</span>`);
      }

      return highlighted;
    });
  };

  const highlightedLines = useMemo(() => {
    if (!file) return [];
    return highlightCode(file.content, file.language);
  }, [file]);

  if (!file) {
    return (
      <div className={cn("w-full h-full min-h-[400px] flex flex-col items-center justify-center glass-base bg-black/20 text-slate-500 font-display select-none p-8", className)}>
        <svg className="w-12 h-12 stroke-current mb-3 opacity-40" viewBox="0 0 24 24" fill="none">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="text-sm font-semibold tracking-wide text-slate-400">No File Open</span>
        <span className="text-xs text-slate-500 mt-1">Select a file from the explorer list to preview its contents.</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full flex flex-col glass-base border border-white/10 rounded-xl overflow-hidden shadow-xl", className)}>
      {/* File Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5 text-xs text-slate-300 font-mono">
        <span className="truncate">{file.path}</span>
        <div className="flex items-center gap-3">
          {file.id && (
            <button
              onClick={handleGenerateTests}
              className="text-[10px] font-bold text-teal-primary hover:text-teal-muted flex items-center gap-1.5 cursor-pointer bg-teal-primary/10 border border-teal-primary/20 px-2.5 py-1 rounded-md transition-all font-display"
            >
              <Sparkles size={11} />
              Generate Tests
            </button>
          )}
          <span className="text-teal-primary/60 uppercase font-mono">{file.language}</span>
        </div>
      </div>
      
      {/* File Scroll Area */}
      <div className="flex-1 overflow-auto bg-black/35 font-mono text-sm leading-relaxed p-4 select-text">
        <div className="flex min-w-full">
          {/* Line Numbers */}
          <div className="flex flex-col text-right text-slate-500 select-none pr-4 border-r border-white/5 min-w-[36px]">
            {highlightedLines.map((_, i) => (
              <span key={i} className="text-xs text-slate-500 leading-[1.7] block pr-1">
                {i + 1}
              </span>
            ))}
          </div>
          
          {/* Code Body */}
          <pre className="flex-1 pl-4 overflow-visible text-[#e2e8f0] font-mono text-xs md:text-sm select-text whitespace-pre leading-[1.7]">
            <code>
              {highlightedLines.map((line, i) => (
                <span
                  key={i}
                  className="block min-h-[1.7em]"
                  dangerouslySetInnerHTML={{ __html: line }}
                />
              ))}
            </code>
          </pre>
        </div>
      </div>

      {/* Test Generation Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`AI Test Suite: ${file.name}`}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              {generatedTests && (
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-xs font-bold text-teal-primary border border-teal-primary/25 bg-teal-primary/10 hover:bg-teal-primary/15 rounded-lg flex items-center gap-1.5 cursor-pointer font-display transition-all"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? 'Copied!' : 'Copy Suite'}
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 border border-white/5 bg-white/2 hover:bg-white/5 rounded-lg cursor-pointer font-display transition-all"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4 max-h-[450px] overflow-y-auto font-mono text-xs text-slate-300">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3 select-none">
                <Loader2 className="w-8 h-8 text-teal-primary animate-spin" />
                <span className="text-sm font-semibold text-slate-300 font-display">Synthesizing Unit Test Suite...</span>
                <span className="text-[10px] text-slate-500 max-w-xs leading-normal font-display">
                  Our LLM is parsing file boundaries, mocking references, and writing code assertions.
                </span>
              </div>
            ) : error ? (
              <div className="text-critical bg-critical/10 border border-critical/20 p-4 rounded-lg flex items-center gap-2 font-display">
                <span>⚠️ {error}</span>
              </div>
            ) : (
              <pre className="bg-black/45 border border-white/5 rounded-xl p-4 leading-relaxed whitespace-pre select-text overflow-x-auto text-[#e2e8f0]">
                <code>{generatedTests}</code>
              </pre>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

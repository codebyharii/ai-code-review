'use client';

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types';
import { Sparkles, User, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  onFileLinkClick?: (path: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFileLinkClick }) => {
  const isUser = message.role === 'user';

  // Parse message content to render text, custom markdown links, and code blocks
  const renderFormattedContent = (content: string) => {
    // Regex for code blocks: ```typescript code ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      const language = match[1] || 'code';
      const code = match[2].trim();

      if (textBefore) {
        parts.push(renderTextAndLinks(textBefore));
      }

      parts.push(
        <div key={`code-${match.index}`} className="my-3 font-mono text-xs">
          <div className="bg-black/40 border-t border-x border-white/5 rounded-t-lg px-3 py-1 text-[10px] text-slate-500 uppercase tracking-wider flex justify-between items-center select-none">
            <span>{language}</span>
            <Terminal size={12} />
          </div>
          <pre className="bg-black/60 border border-white/5 rounded-b-lg p-3 overflow-x-auto text-[#e2e8f0] leading-relaxed select-text whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = codeBlockRegex.lastIndex;
    }

    const textRemaining = content.substring(lastIndex);
    if (textRemaining) {
      parts.push(renderTextAndLinks(textRemaining));
    }

    return parts;
  };

  // Helper to parse file links and bold text
  const renderTextAndLinks = (text: string) => {
    // Matches file:// links: [label](file:///path#line)
    const fileLinkRegex = /\[([^\]]+)\]\(file:\/\/\/([^)]+)\)/g;
    const items = [];
    let lastIndex = 0;
    let match;

    while ((match = fileLinkRegex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index);
      const label = match[1];
      const filePath = match[2];

      if (textBefore) {
        items.push(...renderInlineFormatting(textBefore));
      }

      items.push(
        <button
          key={`link-${match.index}`}
          onClick={() => onFileLinkClick && onFileLinkClick(filePath.split('#')[0])}
          className="text-teal-primary hover:text-teal-muted underline font-mono text-xs bg-teal-primary/5 border border-teal-primary/20 px-1.5 py-0.5 rounded cursor-pointer transition-all inline-block mx-0.5"
        >
          {label}
        </button>
      );

      lastIndex = fileLinkRegex.lastIndex;
    }

    const remaining = text.substring(lastIndex);
    if (remaining) {
      items.push(...renderInlineFormatting(remaining));
    }

    return <p key={`text-${lastIndex}`} className="whitespace-pre-line leading-relaxed text-sm">{items}</p>;
  };

  // Helper for inline bold / italics
  const renderInlineFormatting = (text: string) => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const pieces = [];
    let lastIdx = 0;
    let m;

    while ((m = boldRegex.exec(text)) !== null) {
      const before = text.substring(lastIdx, m.index);
      if (before) pieces.push(before);
      pieces.push(<strong key={`bold-${m.index}`} className="font-bold text-white">{m[1]}</strong>);
      lastIdx = boldRegex.lastIndex;
    }

    const rem = text.substring(lastIdx);
    if (rem) pieces.push(rem);
    return pieces;
  };

  return (
    <div
      className={cn(
        "flex w-full gap-3 font-display py-2.5 animate-fade-in-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-primary to-teal-dark flex items-center justify-center text-white shadow-[0_0_8px_rgba(0,212,212,0.3)] min-w-[32px]">
          <Sparkles size={14} className="animate-pulse" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl border text-white/90 select-text",
          isUser
            ? [
                "bg-gradient-to-br from-teal-primary/10 to-teal-dark/5 border-teal-primary/20",
                "rounded-tr-none shadow-md"
              ]
            : [
                "glass-base bg-white/4 border-white/10",
                "rounded-tl-none shadow-lg"
              ]
        )}
      >
        <div className="flex flex-col gap-1">
          {renderFormattedContent(message.content)}
        </div>
        <div className="text-[9px] text-slate-500 text-right mt-2 font-mono">
          {message.timestamp}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 shadow min-w-[32px]">
          <User size={14} />
        </div>
      )}
    </div>
  );
};

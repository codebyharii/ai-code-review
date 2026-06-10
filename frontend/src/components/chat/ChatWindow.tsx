'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from './ChatMessage';
import { Button } from '../ui/Button';
import { MessageSquareCode, Send, Sparkles, Terminal, FileCode, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  projectId: string;
  onFileLinkClick?: (path: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ projectId, onFileLinkClick }) => {
  const { chatHistory, addChatMessage, projects, selectedFiles, activeFile } = useApp();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find(p => p.id === projectId);
  const history = chatHistory[projectId] || [];

  // Scroll to bottom on history change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageToSend = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      await addChatMessage(projectId, messageToSend);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePromptSuggestion = (text: string) => {
    setInputText(text);
  };

  const suggestions = [
    `How do I secure the database credentials in my config?`,
    `Explain the performance bottlenecks in find_duplicates`,
    `What are the risks of using MD5 for hashing?`,
    `How can I write test coverage for userController?`
  ];

  return (
    <div className="w-full h-[550px] flex flex-col glass-base bg-black/10 border border-white/5 rounded-xl overflow-hidden shadow-2xl font-display">
      {/* Header Info */}
      <div className="px-5 py-3.5 bg-black/40 border-b border-white/5 flex justify-between items-center select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-teal-primary/10 text-teal-primary border border-teal-primary/20">
            <MessageSquareCode size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Copilot Chat</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium truncate max-w-[150px] sm:max-w-xs">
              Context: {currentProject?.name}
            </p>
          </div>
        </div>

        {/* Context Chip Info */}
        <div className="hidden sm:flex items-center gap-2">
          {activeFile && (
            <span className="text-[10px] bg-teal-primary/10 border border-teal-primary/20 text-teal-primary px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <FileCode size={11} />
              {activeFile.name}
            </span>
          )}
          {selectedFiles.length > 0 && (
            <span className="text-[10px] bg-slate-300/10 border border-slate-300/20 text-[#8b96f9] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle size={11} />
              +{selectedFiles.length} files
            </span>
          )}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-black/15">
        {history.length > 0 ? (
          history.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onFileLinkClick={onFileLinkClick}
            />
          ))
        ) : (
          // Empty State Suggestions
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 select-none animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-primary/10 to-teal-dark/5 flex items-center justify-center text-teal-primary border border-teal-primary/20 shadow-md mb-4 animate-pulse">
              <Sparkles size={20} />
            </div>
            <h4 className="text-sm font-bold text-white tracking-wide">Ask anything about your codebase</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
              Your AI reviewer has indexed your files and is ready to explain anomalies, generate optimizations, or write test coverage scripts.
            </p>

            <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptSuggestion(sug)}
                  className="glass-subtle bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10 p-2.5 rounded-lg text-[11px] text-slate-300 hover:text-white leading-normal text-left transition-all cursor-pointer font-medium"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing Bubble */}
        {isTyping && (
          <div className="flex w-full justify-start gap-3 items-center py-2 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-primary to-teal-dark flex items-center justify-center text-white shadow min-w-[32px]">
              <Sparkles size={14} className="animate-spin" />
            </div>
            <div className="glass-base bg-white/4 border-white/10 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 min-w-[64px]">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-primary/80 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-teal-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-teal-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls form */}
      <form
        onSubmit={handleSend}
        className="p-4 bg-black/40 border-t border-white/5 flex gap-2.5 items-center"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI Copilot for refactoring, bug fixes, or annotations..."
          className="flex-1 bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400/60 focus:outline-none focus:border-teal-primary focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(0,212,212,0.15)] transition-all duration-200"
        />
        <Button
          variant="primary"
          type="submit"
          className="p-3 w-10 h-10 px-0 py-0 rounded-[10px]"
          disabled={!inputText.trim() || isTyping}
        >
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderGit2,
  ShieldCheck,
  MessageSquareCode,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Terminal
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useApp();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
    { label: 'Reviews', path: '/reviews', icon: ShieldCheck },
    { label: 'AI Chat', path: '/chat', icon: MessageSquareCode },
    { label: 'History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  // If user is on login or register pages, do not render sidebar
  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <>
      {/* Desktop Sidebar (visible on sm and above) */}
      <aside
        className={cn(
          "hidden sm:flex flex-col h-screen sticky top-0 bg-[#121212]/90 border-r border-white/5 backdrop-blur-[24px] z-30 transition-all duration-300 select-none",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800/80 border border-white/20 shadow-[0_0_12px_rgba(0,0,0,0.15)]">
              <Terminal className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-display font-bold text-sm tracking-widest text-white uppercase whitespace-nowrap">
                Review.AI
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group relative border",
                  isActive
                    ? "border-white/15 bg-white/5 text-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.02)]"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/2"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "min-w-[20px] transition-colors duration-200",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  )}
                />
                {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-16 hidden group-hover:block bg-bg-elevated border border-white/10 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-50 shadow-md">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        {user && (
          <div className="p-4 border-t border-white/5 bg-black/10 flex flex-col gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-white/15 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">{user.name}</span>
                  <span className="text-[10px] text-zinc-500 truncate">{user.email}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 text-xs font-semibold text-red-500 hover:text-red-400 cursor-pointer hover:bg-red-500/10 py-2 rounded-lg transition-all",
                isCollapsed ? "justify-center px-0" : "px-3"
              )}
            >
              <LogOut size={16} />
              {!isCollapsed && <span>Log Out</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation (visible on width < 640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#121212]/95 border-t border-white/5 backdrop-blur-[24px] z-30 flex items-center justify-around px-2 pb-safe select-none">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 rounded-lg text-slate-400 hover:text-white transition-all",
                isActive ? "text-white" : ""
              )}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-slate-400"} />
              <span className="text-[9px] mt-1 font-medium">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
};

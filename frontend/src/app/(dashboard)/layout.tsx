'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    // If not logged in, redirect to login page
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    // Return loading state during redirect check to avoid UI flashes
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-deep text-slate-400 font-display font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-primary/20 border-t-teal-primary" />
          <span>Securing session scope...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-bg-deep relative pb-16 sm:pb-0">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content pane */}
      <main className="flex-1 overflow-x-hidden p-6 sm:p-8 flex flex-col max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

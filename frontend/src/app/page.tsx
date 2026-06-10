'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg-deep text-slate-400 font-display font-medium">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-primary/20 border-t-teal-primary" />
        <span>Initializing Workspace Environment...</span>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Terminal, Key, Mail, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShouldShake(false);

    if (!email.trim() || !password.trim()) {
      setError("Please fill out all credentials.");
      setShouldShake(true);
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError("Invalid email or access password.");
        setShouldShake(true);
      }
    } catch (err: any) {
      setError(err.message || "Authentication gateway timeout. Please try again.");
      setShouldShake(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-bg-deep bg-dot-grid overflow-hidden font-display p-4">
      {/* Ambient Radial Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00d4d4]/10 blur-[120px] animate-glow-pulse select-none pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-peach/10 blur-[120px] animate-glow-pulse select-none pointer-events-none" style={{ animationDelay: '1s' }} />

      {/* Login Card */}
      <div
        className={cn(
          "w-full max-w-[420px] glass-base bg-white/4 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative z-10 transition-transform duration-300",
          shouldShake ? "animate-[shake_0.4s_ease-in-out]" : "animate-fade-in-up"
        )}
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center select-none">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-primary to-teal-dark shadow-[0_0_20px_rgba(0,0,0,0.15)] mb-3">
            <Terminal className="w-6 h-6 text-[#ffffff]" />
          </div>
          <h2 className="text-2xl font-bold tracking-wide text-white">Welcome Back</h2>
          <p className="text-xs text-slate-300/60 mt-1">
            Access your automated code review dashboard
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="Developer Email"
              type="email"
              placeholder="e.g. ada@lovelace.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            <Mail className="absolute left-3 bottom-3.5 w-4 h-4 text-slate-400" />
          </div>

          <div className="relative">
            <Input
              label="Access Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
            <Key className="absolute left-3 bottom-3.5 w-4 h-4 text-slate-400" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-critical bg-critical/10 border border-critical/20 p-3 rounded-lg mt-2 font-medium">
              <AlertCircle size={14} className="min-w-[14px]" />
              <span>{error}</span>
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            className="w-full mt-6 py-3 font-semibold"
            loading={isLoading}
          >
            Authenticate Session
          </Button>
        </form>

        {/* Redirect Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Don't have a workspace account?{' '}
            <Link href="/register" className="text-teal-primary hover:text-teal-muted underline transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>

      {/* Inline styles for custom shake keyframes */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

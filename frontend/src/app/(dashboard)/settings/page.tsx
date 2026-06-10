'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  Settings,
  BrainCircuit,
  User,
  Sliders,
  CheckCircle2,
  XCircle,
  Activity,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const {
    user,
    login, // Re-uses login function to update local profile name/email in context
    providers,
    updateProviderSettings,
    toggleProviderActive,
    testProviderConnection
  } = useApp();

  // Profile forms
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Settings preferences
  const [reviewMode, setReviewMode] = useState('security');
  const [severityThreshold, setSeverityThreshold] = useState('medium');
  const [prefSaved, setPrefSaved] = useState(false);

  // Connection testing spinner states
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [id: string]: { success: boolean; message: string } }>({});

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) return;
    
    await login(profileName, profileEmail);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handlePreferencesSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  };

  const handleTestConnection = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await testProviderConnection(providerId);
      setTestResult(prev => ({
        ...prev,
        [providerId]: res
      }));
    } catch (err) {
      setTestResult(prev => ({
        ...prev,
        [providerId]: { success: false, message: 'Connection endpoint failed.' }
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up font-display pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Settings className="text-teal-primary animate-spin-slow" />
          System Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure active AI providers, developer profiles, and default auditing scopes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Configuration Columns (Col-span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Providers Section */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2 px-1">
              <BrainCircuit size={18} className="text-teal-primary" />
              AI Model Providers
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {providers.map((prov) => {
                const isTesting = testingId === prov.id;
                const result = testResult[prov.id];

                return (
                  <div
                    key={prov.id}
                    className={cn(
                      "glass-base p-5 flex flex-col justify-between border transition-all duration-300 relative",
                      prov.active ? "border-teal-primary/40 bg-teal-primary/3 shadow-[0_0_20px_rgba(0,212,212,0.1)]" : "border-white/5 bg-white/2"
                    )}
                  >
                    {/* Header Card */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{prov.logo}</span>
                        <span className="text-sm font-bold text-white tracking-wide">{prov.name}</span>
                      </div>
                      
                      {/* Active Indicator Badge */}
                      {prov.active ? (
                        <span className="text-[9px] bg-teal-primary/20 border border-teal-primary/30 text-teal-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_0_8px_rgba(0,212,212,0.2)]">
                          <Check size={10} strokeWidth={3} />
                          Active
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleProviderActive(prov.id)}
                          className="text-[9px] border border-white/10 hover:border-white/30 text-slate-400 hover:text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3 mb-6">
                      <Input
                        label="Endpoint Base URL"
                        placeholder="e.g. http://localhost:11434"
                        value={prov.baseUrl}
                        onChange={(e) => updateProviderSettings(prov.id, e.target.value, prov.apiKey, prov.modelName)}
                      />
                      <Input
                        label="API Key / Token"
                        type="password"
                        placeholder={prov.apiKey ? "••••••••••••••••••••" : "No token required"}
                        value={prov.apiKey}
                        onChange={(e) => updateProviderSettings(prov.id, prov.baseUrl, e.target.value, prov.modelName)}
                      />
                      <Input
                        label="Model Identifier"
                        placeholder="e.g. codegemma:latest"
                        value={prov.modelName}
                        onChange={(e) => updateProviderSettings(prov.id, prov.baseUrl, prov.apiKey, e.target.value)}
                      />
                    </div>

                    {/* Bottom controls test */}
                    <div className="flex flex-col gap-3 pt-3 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTestConnection(prov.id)}
                          loading={isTesting}
                        >
                          <Activity size={12} />
                          Test Connection
                        </Button>
                        
                        {/* Connection checks */}
                        {prov.connected === true && !result && (
                          <span className="text-xs text-teal-primary font-bold flex items-center gap-1">
                            <CheckCircle2 size={13} />
                            Connected
                          </span>
                        )}
                      </div>

                      {/* Connection Test Result message banner */}
                      {result && (
                        <div
                          className={cn(
                            "flex items-start gap-2 p-2.5 rounded-lg text-xs leading-normal font-medium border",
                            result.success
                              ? "bg-teal-primary/10 border-teal-primary/20 text-teal-primary"
                              : "bg-critical/10 border-critical/20 text-critical"
                          )}
                        >
                          {result.success ? (
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={14} className="shrink-0 mt-0.5" />
                          )}
                          <span>{result.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Profile & Preferences Columns (Col-span 1) */}
        <div className="space-y-8">
          
          {/* Profile Form */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2 px-1">
              <User size={18} className="text-teal-primary" />
              Account Settings
            </h2>
            
            <form onSubmit={handleProfileSave} className="glass-base bg-white/2 border border-white/5 p-5 space-y-4 shadow-xl">
              <Input
                label="Display Name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
              />
              
              <Button variant="primary" type="submit" className="w-full">
                {profileSaved ? 'Profile Updated!' : 'Save Account Settings'}
              </Button>
            </form>
          </div>

          {/* Preferences Form */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2 px-1">
              <Sliders size={18} className="text-teal-primary" />
              Auditing Preferences
            </h2>
            
            <form onSubmit={handlePreferencesSave} className="glass-base bg-white/2 border border-white/5 p-5 space-y-4 shadow-xl">
              <Select
                label="Default Review Mode"
                options={[
                  { value: 'security', label: '🛡️ Security Audits' },
                  { value: 'performance', label: '⚡ Performance' },
                  { value: 'quality', label: '✨ Clean Quality' }
                ]}
                value={reviewMode}
                onChange={(e: any) => setReviewMode(e.target.value)}
              />

              <Select
                label="Vulnerability Severity Flag"
                options={[
                  { value: 'critical', label: '🔴 Critical & above' },
                  { value: 'high', label: '🟠 High & above' },
                  { value: 'medium', label: '🟡 Medium & above' },
                  { value: 'low', label: '🟢 Low & above' }
                ]}
                value={severityThreshold}
                onChange={(e: any) => setSeverityThreshold(e.target.value)}
              />
              
              <Button variant="primary" type="submit" className="w-full">
                {prefSaved ? 'Preferences Saved!' : 'Save Preferences'}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

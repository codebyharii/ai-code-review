'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, Review, AIProviderConfig, ChatMessage, ProjectFile, ReviewIssue } from '../types';

interface AppContextType {
  user: { name: string; email: string } | null;
  token: string | null;
  projects: Project[];
  reviews: Review[];
  providers: AIProviderConfig[];
  chatHistory: { [projectId: string]: ChatMessage[] };
  activeProjectId: string | null;
  activeFile: ProjectFile | null;
  selectedFiles: string[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  addProject: (name: string, description: string, files: File[]) => Promise<string>;
  deleteProject: (projectId: string) => Promise<void>;
  runReview: (
    projectId: string, 
    type: 'security' | 'performance' | 'quality' | 'custom', 
    scope: 'current' | 'selected' | 'all'
  ) => Promise<string>;
  reRunReview: (reviewId: string) => Promise<void>;
  addChatMessage: (projectId: string, content: string) => Promise<void>;
  updateProviderSettings: (providerId: string, baseUrl: string, apiKey: string, modelName: string) => Promise<void>;
  toggleProviderActive: (providerId: string) => Promise<void>;
  testProviderConnection: (providerId: string) => Promise<{ success: boolean; message: string }>;
  generateTests: (fileId: string) => Promise<string>;
  generateDocs: (projectId: string) => Promise<string>;
  setActiveProjectId: (id: string | null) => void;
  setActiveFile: (file: ProjectFile | null) => void;
  setSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const mapProviderLogo = (name: string): string => {
  const lowercase = name.toLowerCase();
  if (lowercase.includes('openai')) return '⚡';
  if (lowercase.includes('gemini')) return '✨';
  if (lowercase.includes('ollama')) return '🦙';
  if (lowercase.includes('lm')) return '💻';
  return '🪐';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [chatHistory, setChatHistory] = useState<{ [projectId: string]: ChatMessage[] }>({});
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Hydrate token/user from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('rev_user');
      const storedToken = localStorage.getItem('rev_token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    }
    setMounted(true);
  }, []);

  // Fetch initial setup data if token is active
  useEffect(() => {
    if (token) {
      fetchProjects();
      fetchReviews();
      fetchProviders();
    }
  }, [token]);

  // Fetch active project files if activeProjectId changes
  useEffect(() => {
    if (token && activeProjectId) {
      fetchProjectDetail(activeProjectId);
      fetchChatHistory(activeProjectId);
    }
  }, [token, activeProjectId]);

  // Helper: headers
  const getHeaders = (multipart = false) => {
    const headers: Record<string, string> = {};
    if (!multipart) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // API Fetches
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          createdAt: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          fileCount: p._count?.files || 0,
          files: [],
        }));
        setProjects(mapped);
        
        // Auto-set active project if none is set
        if (mapped.length > 0 && !activeProjectId) {
          setActiveProjectId(mapped[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchProjectDetail = async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const project = await response.json();
        const mappedFiles = (project.files || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          path: f.path,
          content: f.content,
          language: f.language,
          projectId: f.projectId,
        }));

        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              files: mappedFiles,
              fileCount: mappedFiles.length,
            };
          }
          return p;
        }));

        // Set active file if none is set or active file belongs to another project
        if (mappedFiles.length > 0) {
          setActiveFile(mappedFiles[0]);
        } else {
          setActiveFile(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch project detail:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((r: any) => mapReview(r));
        setReviews(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-providers`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          logo: mapProviderLogo(p.name),
          baseUrl: p.baseUrl,
          apiKey: p.apiKey || '',
          modelName: p.modelName,
          active: p.active,
          connected: null,
        }));
        setProviders(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  const fetchChatHistory = async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chat`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const session = await response.json();
        const messages = (session.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        }));
        setChatHistory(prev => ({
          ...prev,
          [projectId]: messages,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  // Map Backend Review report to Frontend Review type
  const mapReview = (r: any): Review => {
    const issues = r.issues || [];
    const severitySummary = { critical: 0, high: 0, medium: 0, low: 0 };
    
    issues.forEach((issue: any) => {
      const sev = issue.severity.toLowerCase() as keyof typeof severitySummary;
      if (severitySummary[sev] !== undefined) {
        severitySummary[sev]++;
      }
    });

    return {
      id: r.id,
      projectId: r.projectId,
      projectName: r.projectName,
      type: r.type as 'security' | 'performance' | 'quality' | 'custom',
      status: r.status as 'success' | 'pending' | 'error',
      date: new Date(r.createdAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      severitySummary,
      issues: issues.map((issue: any) => ({
        id: issue.id,
        severity: issue.severity.toLowerCase() as 'critical' | 'high' | 'medium' | 'low',
        file: issue.filePath,
        line: issue.lineStart || 1,
        description: issue.description,
        suggestion: issue.recommendation,
        snippet: issue.description.includes('eval') || issue.description.includes('concatenation') || issue.description.includes('loop') ? issue.recommendation : issue.description,
      })),
    };
  };

  // Auth Operations
  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Developer authorization credentials invalid.');
    }

    const data = await response.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('rev_user', JSON.stringify(data.user));
    localStorage.setItem('rev_token', data.token);
    return true;
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to initialize developer profile.');
    }

    const data = await response.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('rev_user', JSON.stringify(data.user));
    localStorage.setItem('rev_token', data.token);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setProjects([]);
    setReviews([]);
    setProviders([]);
    setChatHistory({});
    setActiveProjectId(null);
    setActiveFile(null);
    localStorage.removeItem('rev_user');
    localStorage.removeItem('rev_token');
  };

  // Projects Operations
  const addProject = async (name: string, description: string, files: File[]) => {
    // 1. Create project entry
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to create project.');
    }

    const project = await response.json();

    // 2. Upload files via multipart request
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const fileUploadResponse = await fetch(`${API_BASE_URL}/projects/${project.id}/files`, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      const data = await fileUploadResponse.json();
      // Delete the created project if file upload fails to keep DB clean
      await fetch(`${API_BASE_URL}/projects/${project.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      throw new Error(data.message || 'Failed to index project source files.');
    }

    // Refresh state
    await fetchProjects();
    setActiveProjectId(project.id);
    await fetchProjectDetail(project.id);

    return project.id;
  };

  const deleteProject = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete project scope.');
    }

    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);

    if (activeProjectId === projectId) {
      if (updated.length > 0) {
        setActiveProjectId(updated[0].id);
      } else {
        setActiveProjectId(null);
        setActiveFile(null);
      }
    }
  };

  // Review Operations
  const runReview = async (
    projectId: string, 
    type: 'security' | 'performance' | 'quality' | 'custom',
    scope: 'current' | 'selected' | 'all'
  ) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) throw new Error('Project scope not found.');

    let fileIds: string[] | undefined = undefined;

    if (scope === 'current' && activeFile?.id) {
      fileIds = [activeFile.id];
    } else if (scope === 'selected' && selectedFiles.length > 0) {
      // Find matching file IDs by paths
      fileIds = targetProject.files
        .filter(f => selectedFiles.includes(f.path) && f.id)
        .map(f => f.id!);
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        projectId,
        type,
        fileIds,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Review execution failed.');
    }

    const reviewReport = await response.json();
    const mapped = mapReview(reviewReport);
    
    // Inject file contents to generate high-fidelity code snippets dynamically
    mapped.issues = mapped.issues.map(issue => {
      const matchingFile = targetProject.files.find(f => f.path === issue.file);
      if (matchingFile && matchingFile.content) {
        const lines = matchingFile.content.split('\n');
        // Subtract 1 since lineStart is 1-indexed, grab around the issue
        const start = Math.max(0, issue.line - 2);
        const end = Math.min(lines.length, issue.line + 2);
        const snippet = lines.slice(start, end).join('\n');
        return {
          ...issue,
          snippet: snippet || issue.snippet,
        };
      }
      return issue;
    });

    setReviews(prev => [mapped, ...prev]);
    return mapped.id;
  };

  const reRunReview = async (reviewId: string) => {
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return;
    await runReview(rev.projectId, rev.type, 'all');
  };

  // Chat Operations
  const addChatMessage = async (projectId: string, content: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    const currentHistory = chatHistory[projectId] || [];
    setChatHistory(prev => ({
      ...prev,
      [projectId]: [...currentHistory, userMsg],
    }));

    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message: content }),
    });

    if (!response.ok) {
      throw new Error('Copilot response timeout.');
    }

    // Refresh chat history
    await fetchChatHistory(projectId);
  };

  // Provider Settings
  const updateProviderSettings = async (providerId: string, baseUrl: string, apiKey: string, modelName: string) => {
    const response = await fetch(`${API_BASE_URL}/ai-providers/${providerId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ baseUrl, apiKey, modelName }),
    });

    if (!response.ok) {
      throw new Error('Failed to update provider configuration.');
    }

    const updated = await response.json();
    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        return {
          ...p,
          baseUrl: updated.baseUrl,
          apiKey: updated.apiKey || '',
          modelName: updated.modelName,
          connected: null,
        };
      }
      return p;
    }));
  };

  const toggleProviderActive = async (providerId: string) => {
    const response = await fetch(`${API_BASE_URL}/ai-providers/${providerId}/activate`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to activate provider.');
    }

    setProviders(prev => prev.map(p => ({
      ...p,
      active: p.id === providerId,
    })));
  };

  const testProviderConnection = async (providerId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-providers/${providerId}/test`, {
        method: 'POST',
        headers: getHeaders(),
      });

      const data = await response.json();
      
      setProviders(prev => prev.map(p => {
        if (p.id === providerId) {
          return {
            ...p,
            connected: data.success,
          };
        }
        return p;
      }));

      return {
        success: data.success,
        message: data.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Connection failed.',
      };
    }
  };

  // Bonus Features: Test and Docs Generator
  const generateTests = async (fileId: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/generate-tests/${fileId}`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorMsg = await response.json();
      throw new Error(errorMsg.message || 'AI test generation failed.');
    }

    const data = await response.json();
    return data.content;
  };

  const generateDocs = async (projectId: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/generate-docs/${projectId}`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorMsg = await response.json();
      throw new Error(errorMsg.message || 'AI documentation generation failed.');
    }

    const data = await response.json();
    return data.content;
  };

  if (!mounted) {
    return null;
  }

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        projects,
        reviews,
        providers,
        chatHistory,
        activeProjectId,
        activeFile,
        selectedFiles,
        login,
        register,
        logout,
        addProject,
        deleteProject,
        runReview,
        reRunReview,
        addChatMessage,
        updateProviderSettings,
        toggleProviderActive,
        testProviderConnection,
        generateTests,
        generateDocs,
        setActiveProjectId,
        setActiveFile,
        setSelectedFiles,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

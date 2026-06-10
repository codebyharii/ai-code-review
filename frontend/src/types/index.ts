export interface ProjectFile {
  id?: string;
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  fileCount: number;
  files: ProjectFile[];
}

export interface ReviewIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  description: string;
  suggestion: string;
  snippet: string;
}

export interface Review {
  id: string;
  projectId: string;
  projectName: string;
  type: 'security' | 'performance' | 'quality' | 'custom';
  status: 'success' | 'pending' | 'error';
  severitySummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  issues: ReviewIssue[];
  date: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  logo: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  active: boolean;
  connected: boolean | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AppState {
  user: { name: string; email: string } | null;
  projects: Project[];
  reviews: Review[];
  settings: {
    providers: AIProviderConfig[];
    defaultReviewMode: 'security' | 'performance' | 'quality' | 'custom';
    defaultSeverityThreshold: 'critical' | 'high' | 'medium' | 'low';
  };
  chatHistory: { [projectId: string]: ChatMessage[] };
  activeProjectId: string | null;
  activeFile: ProjectFile | null;
  selectedFiles: string[];
}

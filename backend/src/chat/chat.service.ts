import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateSession(userId: string, projectId: string) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project scope not found.');
    }

    let session = await this.prisma.chatSession.findFirst({
      where: { projectId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          projectId,
          userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return session;
  }

  async sendMessage(userId: string, projectId: string, dto: SendMessageDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { files: true },
    });
    if (!project) {
      throw new NotFoundException('Project scope not found.');
    }

    // Get or create session
    const session = await this.getOrCreateSession(userId, projectId);

    // 1. Save user message in DB
    await this.prisma.chatMessage.create({
      data: {
        role: 'user',
        content: dto.message,
        sessionId: session.id,
      },
    });

    // 2. Load active provider configuration
    const provider = await this.prisma.aIProvider.findFirst({
      where: { userId, active: true },
    });

    let assistantReply = '';
    let isSuccess = false;

    if (provider && provider.baseUrl) {
      try {
        assistantReply = await this.runAIChat(provider, project.files, session.messages, dto.message);
        isSuccess = true;
      } catch (err) {
        console.warn('AI chat completions failed. Falling back to local assistant responder:', err);
      }
    }

    // 3. Fallback: Run static co-pilot response generator if AI is offline
    if (!isSuccess) {
      assistantReply = this.runStaticChatReply(project.files, dto.message);
    }

    // 4. Save assistant reply in DB
    const createdMsg = await this.prisma.chatMessage.create({
      data: {
        role: 'assistant',
        content: assistantReply,
        sessionId: session.id,
      },
    });

    return createdMsg;
  }

  private async runAIChat(provider: any, files: any[], history: any[], newMessage: string) {
    // Pack files into a readable context (limit content length to keep prompt reasonable)
    const filesContext = files.map(f => {
      const truncatedContent = f.content.length > 3000 ? `${f.content.substring(0, 3000)}\n[Content Truncated...]` : f.content;
      return `File: ${f.path}\nContent:\n${truncatedContent}`;
    }).join('\n\n');

    const systemPrompt = `You are "Review.AI Copilot", an advanced AI assistant designed to help developers optimize, explain, and debug their codebase.
Use the following project files as context to answer the developer's question. 

--- PROJECT CODEBASE CONTEXT ---
${filesContext}
--------------------------------

Answer the developer's query clearly. You can output code blocks, markdown lists, or explanations. Keep your response concise, professional, and directly rooted in the provided context.`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })), // Send last 10 dialogs
      { role: 'user', content: newMessage }
    ];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.modelName,
        messages: chatMessages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LLM provider returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  private runStaticChatReply(files: any[], message: string): string {
    const query = message.toLowerCase();
    const filesList = files.map(f => `\`${f.path}\``).join(', ');

    if (files.length === 0) {
      return `Your project workspace is currently empty. Please upload some source files using the file tree so that I can inspect your code and assist you!`;
    }

    if (query.includes('auth') || query.includes('login') || query.includes('sign')) {
      const match = files.find(f => f.path.toLowerCase().includes('auth') || f.path.toLowerCase().includes('login') || f.path.toLowerCase().includes('user'));
      if (match) {
        return `Based on your files tree, authentication functions appear to be related to the [${match.name}](file:///${match.path}) file.\n\nHere is a snippet from that file:\n\`\`\`${match.language}\n${match.content.substring(0, 350)}\n\`\`\`\n\nYou can query this file context directly by asking me specific questions about its modules!`;
      }
      return `I see ${files.length} files in your repository (${filesList}), but I couldn't isolate a specific authorization controller or user session script. Ensure you upload your user service module to explore the details.`;
    }

    if (query.includes('database') || query.includes('connection') || query.includes('db') || query.includes('config')) {
      const match = files.find(f => f.path.toLowerCase().includes('db') || f.path.toLowerCase().includes('config') || f.path.toLowerCase().includes('sql') || f.path.toLowerCase().includes('prisma'));
      if (match) {
        return `Your project database configurations and keys seem to be referenced in the [${match.name}](file:///${match.path}) file:\n\`\`\`${match.language}\n${match.content.substring(0, 350)}\n\`\`\`\n\nIf you need to move these credentials to an environment file, you can create a local \`.env\` file in your directory root and reference it using \`process.env\`.`;
      }
      return `I checked your files directory (${filesList}), but I couldn't find a direct database schema or credentials file. Please check if you have a config module that needs to be uploaded.`;
    }

    // Default reply summarizing files and options
    return `Hello! I am your **Review.AI Co-pilot**. 

I have indexed your project files: ${filesList}.

You can ask me questions about:
- How configurations are structured.
- Security vulnerabilities in specific files.
- Optimization suggestions for performance loops.

*Note: Since the AI model provider is currently offline, I am responding with local repository index context. Turn on your Ollama, LM Studio, or OpenAI connection in the Settings to get full AI answers!*`;
  }
}

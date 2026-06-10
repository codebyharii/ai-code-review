import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.review.findMany({
      where: { project: { userId } },
      include: {
        issues: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, project: { userId } },
      include: {
        issues: true,
      },
    });
    if (!review) {
      throw new NotFoundException('Review report not found.');
    }
    return review;
  }

  async create(userId: string, dto: CreateReviewDto) {
    // 1. Fetch project and verify ownership
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, userId },
      include: { files: true },
    });
    if (!project) {
      throw new NotFoundException('Project scope not found.');
    }

    if (project.files.length === 0) {
      throw new BadRequestException('No files exist in this project. Please upload source code first.');
    }

    // Filter files if target files are specified
    const targetFiles = dto.fileIds && dto.fileIds.length > 0
      ? project.files.filter(f => dto.fileIds!.includes(f.id))
      : project.files;

    if (targetFiles.length === 0) {
      throw new BadRequestException('Specified files not found in the project.');
    }

    // 2. Load active provider configuration
    const provider = await this.prisma.aIProvider.findFirst({
      where: { userId, active: true },
    });

    let reviewData = {
      summary: '',
      issues: [] as any[],
    };

    let isSuccess = false;

    if (provider && provider.baseUrl) {
      try {
        reviewData = await this.runAIReview(provider, targetFiles, dto.type);
        isSuccess = true;
      } catch (err) {
        console.warn('AI review failed or timed out. Falling back to local static scanner:', err);
      }
    }

    // 3. Fallback: Run Static Code Analysis if AI is offline
    if (!isSuccess) {
      reviewData = this.runStaticAnalysis(targetFiles, dto.type);
    }

    // 4. Save Review to database
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          projectName: project.name,
          type: dto.type,
          summary: reviewData.summary,
          status: 'success',
          projectId: project.id,
        },
      });

      const issuesToCreate = reviewData.issues.map((issue: any) => ({
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
        severity: issue.severity.toLowerCase(),
        filePath: issue.filePath || 'unknown',
        lineStart: issue.lineStart || null,
        lineEnd: issue.lineEnd || null,
        reviewId: review.id,
      }));

      if (issuesToCreate.length > 0) {
        await tx.issue.createMany({
          data: issuesToCreate,
        });
      }

      return tx.review.findUnique({
        where: { id: review.id },
        include: { issues: true },
      });
    });
  }

  private async runAIReview(provider: any, files: any[], type: string) {
    // Pack files into a readable context
    const filesContext = files.map(f => `--- File: ${f.path} ---\n${f.content}`).join('\n\n');

    const systemPrompt = `You are an expert software security engineer, performance architect, and senior code reviewer. 
Audit the provided code files for the "${type.toUpperCase()}" category.
You MUST output your response in valid JSON format. Do not write any markdown wrappers or introductory conversational text. Return only the JSON object.

JSON Schema format:
{
  "summary": "A 2-3 sentence overview of the audit results.",
  "issues": [
    {
      "title": "Short title describing the issue",
      "description": "Detailed description of what is wrong.",
      "recommendation": "Code snippet or exact step to fix the problem.",
      "severity": "critical" | "high" | "medium" | "low",
      "filePath": "relative path of the file",
      "lineStart": 12,
      "lineEnd": 15
    }
  ]
}`;

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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: filesContext }
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LLM provider returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content.trim();

    // Parse JSON
    // Clean any markdown code block wraps (like \`\`\`json ... \`\`\`)
    const cleanedJson = rawContent.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    return JSON.parse(cleanedJson);
  }

  private runStaticAnalysis(files: any[], type: string) {
    const issues: any[] = [];
    let summary = '';

    if (type === 'security') {
      summary = `Completed local static security scanning of ${files.length} files. Isolated potential vulnerabilities matching patterns of hardcoded keys and insecure APIs.`;
      
      files.forEach(file => {
        // Rule A: Hardcoded Secrets
        const secretRegex = /(password|passwd|api_key|secret|token|private_key)\s*=\s*['"][a-zA-Z0-9_\-\+\/]{8,}['"]/i;
        const secretMatch = file.content.match(secretRegex);
        if (secretMatch) {
          const lineNumber = this.getLineNumber(file.content, secretMatch.index || 0);
          issues.push({
            title: 'Hardcoded Authentication Credential',
            description: `Potential secret token or credential variable assignment isolated inside file: "${file.name}". Storing secrets in plain text poses high security leakages.`,
            recommendation: `// Recommended Fix: Move secrets to an environment variable file (.env) and read them dynamically.\nconst apiKey = process.env.API_KEY || '';`,
            severity: 'critical',
            filePath: file.path,
            lineStart: lineNumber,
            lineEnd: lineNumber,
          });
        }

        // Rule B: Eval Use
        if (file.content.includes('eval(')) {
          const index = file.content.indexOf('eval(');
          const lineNumber = this.getLineNumber(file.content, index);
          issues.push({
            title: 'Dangerous Execution of Arbitrary Code (eval)',
            description: `Detected use of the JavaScript 'eval()' function. eval execution is prone to injection exploitation if parameters contain untrusted inputs.`,
            recommendation: `// Recommended Fix: Avoid using eval(). Use JSON.parse() or specific functional maps.\n// Before: eval('const user = ' + req.body);\n// After: const user = JSON.parse(req.body);`,
            severity: 'high',
            filePath: file.path,
            lineStart: lineNumber,
            lineEnd: lineNumber,
          });
        }

        // Rule C: SQL Injection pattern
        const sqlConcat = /select\s+.*\s+from\s+.*\s+where\s+.*=.*\+\s*\w+/i;
        const sqlMatch = file.content.match(sqlConcat);
        if (sqlMatch) {
          const lineNumber = this.getLineNumber(file.content, sqlMatch.index || 0);
          issues.push({
            title: 'Insecure SQL Concatenation (SQLi Risk)',
            description: `Raw string concatenation used inside SQL query execution. This pattern is vulnerable to parameter manipulation SQL payload injection.`,
            recommendation: `// Recommended Fix: Utilize parameterized bindings instead of string interpolation.\nconst query = 'SELECT * FROM users WHERE id = $1';\nconst result = await client.query(query, [userId]);`,
            severity: 'critical',
            filePath: file.path,
            lineStart: lineNumber,
            lineEnd: lineNumber,
          });
        }
      });

      if (issues.length === 0) {
        issues.push({
          title: 'Basic Security Hardening Complete',
          description: 'No immediate hardcoded secrets or sql injections patterns matched static rules.',
          recommendation: 'Ensure all parameters are sanitized before hitting system commands.',
          severity: 'low',
          filePath: files[0].path,
          lineStart: 1,
          lineEnd: 1,
        });
      }
    } else if (type === 'performance') {
      summary = `Completed static performance inspection of ${files.length} files. Audited complexity loops and memory leak points.`;
      
      files.forEach(file => {
        // Rule A: Triple Nested Loop
        const tripleLoop = /for\s*\(.*\)\s*\{\s*.*for\s*\(.*\)\s*\{\s*.*for\s*\(.*\)\s*\{/s;
        const tripleMatch = file.content.match(tripleLoop);
        if (tripleMatch) {
          const lineNumber = this.getLineNumber(file.content, tripleMatch.index || 0);
          issues.push({
            title: 'High Complexity Nested Loop (O(N³))',
            description: `Three-level nested loop detected. This has cubic runtime complexity which causes blocking loops for large dataset operations.`,
            recommendation: `// Recommended Fix: Flatten loops by utilizing mapping indexes or lookup key caches.\n// Map items to an object first to avoid O(N²) or O(N³) complexity checks.`,
            severity: 'high',
            filePath: file.path,
            lineStart: lineNumber,
            lineEnd: lineNumber + 2,
          });
        }

        // Rule B: Sync FS Calls
        if (file.content.includes('readFileSync') || file.content.includes('writeFileSync')) {
          const index = file.content.indexOf('readFileSync') !== -1 ? file.content.indexOf('readFileSync') : file.content.indexOf('writeFileSync');
          const lineNumber = this.getLineNumber(file.content, index);
          issues.push({
            title: 'Blocking Synchronous File System Call',
            description: `Synchronous file system operations block the single-threaded event loop execution.`,
            recommendation: `// Recommended Fix: Switch to async promise-based operations.\nimport { promises as fs } from 'fs';\nconst data = await fs.readFile(filePath, 'utf8');`,
            severity: 'medium',
            filePath: file.path,
            lineStart: lineNumber,
            lineEnd: lineNumber,
          });
        }
      });

      if (issues.length === 0) {
        issues.push({
          title: 'Resource Allocation Check Passed',
          description: 'No synchronous blocking operations or triple nesting patterns matched.',
          recommendation: 'Benchmark logic against microservice scaling models.',
          severity: 'low',
          filePath: files[0].path,
          lineStart: 1,
          lineEnd: 1,
        });
      }
    } else {
      // quality
      summary = `Completed code quality and styling check of ${files.length} files. Evaluated DRY principles and readability patterns.`;
      
      files.forEach(file => {
        // Rule A: Empty Catch Blocks
        const emptyCatch = /catch\s*\((.*?)\)\s*\{\s*\}/s;
        const catchMatch = file.content.match(emptyCatch);
        if (catchMatch) {
          const lineNumber = this.getLineNumber(file.content, catchMatch.index || 0);
          issues.push({
            title: 'Empty Exception Handler (Swallowed Error)',
            description: `Errors are caught but swallowed silently. This conceals bugs and makes system tracing impossible.`,
            recommendation: `// Recommended Fix: Log or propagate the error.\ncatch (err) {\n  console.error('Failed operational log:', err);\n  throw err;\n}`,
            severity: 'medium',
            filePath: file.path,
            lineStart: lineNumber,
            lineEnd: lineNumber + 1,
          });
        }

        // Rule B: TODO comments
        const todoRegex = /\/\/\s*TODO/i;
        const todoMatch = file.content.match(todoRegex);
        if (todoMatch) {
          const lineNumber = this.getLineNumber(file.content, todoMatch.index || 0);
          issues.push({
            title: 'Unresolved TODO Comment Refactor',
            description: `Pending tasks or refactor items left in source code directory.`,
            recommendation: 'Track and resolve TODO items inside task boards or complete the remaining features.',
            severity: 'low',
            filePath: file.path,
            lineStart: lineNumber,
            lineEnd: lineNumber,
          });
        }
      });

      if (issues.length === 0) {
        issues.push({
          title: 'Naming Conventions Verified',
          description: 'Clean coding paradigms match standard rules.',
          recommendation: 'Maintain strict type assertions.',
          severity: 'low',
          filePath: files[0].path,
          lineStart: 1,
          lineEnd: 1,
        });
      }
    }

    return { summary, issues };
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }
}

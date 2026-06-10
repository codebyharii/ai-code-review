import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as unzipper from 'unzipper';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async uploadFiles(userId: string, projectId: string, files: Express.Multer.File[]) {
    // Verify project ownership
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project scope not found.');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for upload.');
    }

    const createdFiles = [];

    for (const file of files) {
      const isZip = file.originalname.endsWith('.zip') || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed';

      if (isZip) {
        // Option A: Extract ZIP Archive
        try {
          const directory = await unzipper.Open.buffer(file.buffer);
          for (const zipEntry of directory.files) {
            // Skip folders or system files (like macOS metadata)
            if (zipEntry.type === 'File' && !zipEntry.path.startsWith('__MACOSX/') && !zipEntry.path.includes('.DS_Store')) {
              const fileContentBuffer = await zipEntry.buffer();
              const content = fileContentBuffer.toString('utf8');
              const name = zipEntry.path.split('/').pop() || zipEntry.path;
              const ext = name.split('.').pop() || 'txt';

              const created = await this.prisma.file.create({
                data: {
                  name,
                  path: zipEntry.path,
                  content,
                  language: this.mapExtensionToLanguage(ext),
                  projectId,
                },
              });
              createdFiles.push(created);
            }
          }
        } catch (err: any) {
          throw new BadRequestException(`Failed to extract ZIP archive: ${err.message}`);
        }
      } else {
        // Option B: Single / Drag & Drop Files
        const content = file.buffer.toString('utf8');
        const ext = file.originalname.split('.').pop() || 'txt';

        const created = await this.prisma.file.create({
          data: {
            name: file.originalname,
            path: file.originalname, // Standard root path
            content,
            language: this.mapExtensionToLanguage(ext),
            projectId,
          },
        });
        createdFiles.push(created);
      }
    }

    return {
      message: `Successfully uploaded and indexed ${createdFiles.length} files.`,
      count: createdFiles.length,
    };
  }

  async getProjectFiles(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      throw new NotFoundException('Project scope not found.');
    }

    return this.prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
    });
  }

  private mapExtensionToLanguage(ext: string): string {
    const mapping: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cs: 'csharp',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      md: 'markdown',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return mapping[ext.toLowerCase()] || 'text';
  }
}

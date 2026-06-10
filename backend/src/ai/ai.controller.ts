import { Controller, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('generate-tests/:fileId')
  async generateTests(@Request() req: any, @Param('fileId') fileId: string) {
    return this.aiService.generateTests(req.user.id, fileId);
  }

  @Post('generate-docs/:projectId')
  async generateDocs(@Request() req: any, @Param('projectId') projectId: string) {
    return this.aiService.generateDocumentation(req.user.id, projectId);
  }
}

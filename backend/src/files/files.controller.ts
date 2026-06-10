import { Controller, Post, Get, Param, UseInterceptors, UploadedFiles, UseGuards, Request } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 20)) // Allow up to 20 files at once
  async uploadFiles(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.filesService.uploadFiles(req.user.id, projectId, files);
  }

  @Get()
  async getFiles(@Request() req: any, @Param('projectId') projectId: string) {
    return this.filesService.getProjectFiles(req.user.id, projectId);
  }
}

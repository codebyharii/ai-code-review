import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  async getChatHistory(@Request() req: any, @Param('projectId') projectId: string) {
    return this.chatService.getOrCreateSession(req.user.id, projectId);
  }

  @Post()
  async sendMessage(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.id, projectId, dto);
  }
}

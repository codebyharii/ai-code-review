import { Controller, Get, Put, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AIProvidersService } from './ai-providers.service';
import { UpdateProviderDto } from './dto/provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai-providers')
export class AIProvidersController {
  constructor(private providersService: AIProvidersService) {}

  @Get()
  async getProviders(@Request() req: any) {
    return this.providersService.findAll(req.user.id);
  }

  @Put(':id')
  async updateProvider(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providersService.update(req.user.id, id, dto);
  }

  @Post(':id/activate')
  async activateProvider(@Request() req: any, @Param('id') id: string) {
    return this.providersService.activate(req.user.id, id);
  }

  @Post(':id/test')
  async testProvider(@Request() req: any, @Param('id') id: string) {
    return this.providersService.testConnection(req.user.id, id);
  }
}

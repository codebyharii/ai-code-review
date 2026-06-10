import { Module } from '@nestjs/common';
import { AIProvidersService } from './ai-providers.service';
import { AIProvidersController } from './ai-providers.controller';

@Module({
  providers: [AIProvidersService],
  controllers: [AIProvidersController],
  exports: [AIProvidersService],
})
export class AIProvidersModule {}

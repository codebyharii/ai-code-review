import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AIProvidersModule } from './ai-providers/ai-providers.module';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChatModule } from './chat/chat.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AIProvidersModule,
    ProjectsModule,
    FilesModule,
    ReviewsModule,
    ChatModule,
    AIModule,
  ],
})
export class AppModule {}

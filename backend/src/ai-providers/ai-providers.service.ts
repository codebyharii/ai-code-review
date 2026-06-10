import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProviderDto } from './dto/provider.dto';

@Injectable()
export class AIProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.aIProvider.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findActive(userId: string) {
    return this.prisma.aIProvider.findFirst({
      where: { userId, active: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { id, userId },
    });
    if (!provider) {
      throw new NotFoundException('AI Provider configuration scope not found.');
    }

    return this.prisma.aIProvider.update({
      where: { id },
      data: {
        baseUrl: dto.baseUrl,
        apiKey: dto.apiKey || null,
        modelName: dto.modelName,
      },
    });
  }

  async activate(userId: string, id: string) {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { id, userId },
    });
    if (!provider) {
      throw new NotFoundException('AI Provider configuration scope not found.');
    }

    // Set all other providers active status to false
    await this.prisma.aIProvider.updateMany({
      where: { userId },
      data: { active: false },
    });

    // Set target provider active to true
    return this.prisma.aIProvider.update({
      where: { id },
      data: { active: true },
    });
  }

  async testConnection(userId: string, id: string) {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { id, userId },
    });
    if (!provider) {
      throw new NotFoundException('AI Provider configuration scope not found.');
    }

    try {
      // Perform dynamic test query endpoint call (timeout 6000ms)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }

      // Hit models or chat completions
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: provider.modelName,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 401 || response.status === 400) {
        // Even 401 (Auth Error) or 400 (Bad Request) means the server is reached and responding!
        return {
          success: true,
          message: `Connection established. Target AI Model server responded with HTTP ${response.status}.`,
        };
      }

      return {
        success: false,
        message: `Endpoint reached but returned an error (HTTP ${response.status}). Check model name or API token.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Network unreachable. Make sure your local model server is running.'}`,
      };
    }
  }
}

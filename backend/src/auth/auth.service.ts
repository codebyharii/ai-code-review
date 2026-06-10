import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A developer account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
    });

    // Automatically seed default AI provider configurations for this user on registration!
    await this.prisma.aIProvider.createMany({
      data: [
        {
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          modelName: 'gpt-4o-mini',
          active: true,
          userId: user.id,
        },
        {
          name: 'Google Gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
          apiKey: '',
          modelName: 'gemini-1.5-flash',
          active: false,
          userId: user.id,
        },
        {
          name: 'Ollama',
          baseUrl: 'http://localhost:11434/v1',
          apiKey: '',
          modelName: 'codegemma:latest',
          active: false,
          userId: user.id,
        },
        {
          name: 'LM Studio',
          baseUrl: 'http://localhost:1234/v1',
          apiKey: '',
          modelName: 'qwen2.5-coder-7b',
          active: false,
          userId: user.id,
        },
      ],
    });

    return this.loginUser(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid developer credentials.');
    }

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid developer credentials.');
    }

    return this.loginUser(user);
  }

  private loginUser(user: { id: string; email: string; name: string }) {
    const payload = { sub: user.id, email: user.email };
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token: this.jwtService.sign(payload),
    };
  }
}

import { IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class UpdateProviderDto {
  @IsNotEmpty({ message: 'Base URL is required.' })
  baseUrl!: string;

  @IsOptional()
  apiKey?: string;

  @IsNotEmpty({ message: 'Model Name is required.' })
  modelName!: string;
}

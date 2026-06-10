import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Project Name is required.' })
  name!: string;

  @IsOptional()
  description?: string;
}

import { IsNotEmpty, IsIn, IsOptional, IsArray, IsString } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty({ message: 'Project ID is required.' })
  projectId!: string;

  @IsNotEmpty({ message: 'Review template type is required.' })
  @IsIn(['security', 'performance', 'quality'], {
    message: 'Review template type must be either security, performance, or quality.',
  })
  type!: 'security' | 'performance' | 'quality';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileIds?: string[];
}

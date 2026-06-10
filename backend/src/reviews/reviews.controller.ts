import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  async getReviews(@Request() req: any) {
    return this.reviewsService.findAll(req.user.id);
  }

  @Get(':id')
  async getReviewDetail(@Request() req: any, @Param('id') id: string) {
    return this.reviewsService.findOne(req.user.id, id);
  }

  @Post()
  async runReview(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }
}

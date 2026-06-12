import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() dto: CreateJobDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.jobsService.create(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: { userId: string }) {
    return this.jobsService.findAllByUser(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  // 아래 세 엔드포인트는 내부 워커용
  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body('progress') progress: number,
  ) {
    return this.jobsService.updateProgress(id, progress);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body('resultUrl') resultUrl: string,
  ) {
    return this.jobsService.complete(id, resultUrl);
  }

  @Patch(':id/fail')
  fail(
    @Param('id') id: string,
    @Body('errorCode') errorCode: string,
  ) {
    return this.jobsService.fail(id, errorCode);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateJobDto, userId: string) {
    return this.prisma.editJob.create({
      data: {
        userId,
        subject: dto.options.subject as any,
        duration: dto.options.duration,
        style: dto.options.style as any,
        videos: {
          create: dto.videos.map((v) => ({
            name: v.name,
            size: v.size,
            duration: v.duration,
            storagePath: v.storagePath,
            thumbnailUrl: v.thumbnailUrl ?? null,
          })),
        },
      },
      include: { videos: true },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.editJob.findMany({
      where: { userId },
      include: { videos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.editJob.findUnique({
      where: { id },
      include: { videos: true },
    });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  updateProgress(id: string, progress: number) {
    return this.prisma.editJob.update({
      where: { id },
      data: { progress },
    });
  }

  complete(id: string, resultUrl: string) {
    return this.prisma.editJob.update({
      where: { id },
      data: { status: 'completed', progress: 100, resultUrl },
    });
  }

  fail(id: string, errorCode: string) {
    return this.prisma.editJob.update({
      where: { id },
      data: { status: 'failed', errorCode },
    });
  }
}

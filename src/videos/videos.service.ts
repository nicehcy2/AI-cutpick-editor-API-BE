import { Injectable } from '@nestjs/common';

@Injectable()
export class VideosService {
  processUploads(files: Express.Multer.File[]) {
    return files.map((file) => ({
      name: file.originalname,
      size: file.size,
      duration: 0, // TODO: ffprobe로 실제 길이 추출
      storagePath: file.path,
      thumbnailUrl: null,
    }));
  }
}

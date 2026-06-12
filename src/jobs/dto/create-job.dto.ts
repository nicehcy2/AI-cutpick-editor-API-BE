import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum EditSubject {
  person = 'person',
  food = 'food',
  product = 'product',
  animal = 'animal',
  landscape = 'landscape',
  object = 'object',
}

export enum EditDuration {
  auto = 'auto',
  s0_30 = '0-30',
  s30_60 = '30-60',
  s60_180 = '60-180',
  s180_300 = '180-300',
  s300plus = '300+',
}

export enum EditStyle {
  voice = 'voice',
  voice_scene = 'voice_scene',
}

export class VideoInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  size: number;

  @IsInt()
  @Min(0)
  duration: number;

  @IsString()
  @IsNotEmpty()
  storagePath: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class EditOptionsDto {
  @IsEnum(EditSubject)
  subject: EditSubject;

  @IsEnum(EditDuration)
  duration: EditDuration;

  @IsEnum(EditStyle)
  style: EditStyle;
}

export class CreateJobDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoInputDto)
  videos: VideoInputDto[];

  @ValidateNested()
  @Type(() => EditOptionsDto)
  options: EditOptionsDto;
}

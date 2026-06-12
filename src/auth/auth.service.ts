import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

const ACCESS_TTL = 60 * 15;          // 15분 (초)
const REFRESH_TTL = 60 * 60 * 24 * 7; // 7일 (초)
const OVERLAP_WINDOW = 30 * 1000;    // 30초 (ms) — 동시 요청 허용 윈도우

interface RedisSession {
  currentAccessJti: string;
  userId: string;
  email: string;
  name: string;
  rtHash: string;
  prevRtHash: string | null;
  rotatedAtEpoch: number;
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function redisKey(familyId: string): string {
  return `rt:session{${familyId}}`;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  path: '/',
  maxAge: REFRESH_TTL * 1000,
  sameSite: 'lax' as const,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('이미 사용 중인 이메일이에요.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    return { userId: user.id, email: user.email };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않아요.');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않아요.');

    const jti = randomUUID();
    const familyId = randomBytes(32).toString('hex');
    const refreshToken = randomBytes(64).toString('hex');

    const session: RedisSession = {
      currentAccessJti: jti,
      userId: user.id,
      email: user.email,
      name: user.name,
      rtHash: sha256(refreshToken),
      prevRtHash: null,
      rotatedAtEpoch: Date.now(),
    };

    await this.redis.set(redisKey(familyId), JSON.stringify(session), REFRESH_TTL);

    const accessToken = this.jwtService.sign({ sub: user.id, jti });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.cookie('familyId', familyId, COOKIE_OPTIONS);

    return { userId: user.id, accessToken };
  }

  async refresh(refreshToken: string, familyId: string, res: Response) {
    if (!refreshToken || !familyId) {
      throw new UnauthorizedException('세션 정보가 없어요.');
    }

    const sessionJson = await this.redis.get(redisKey(familyId));
    if (!sessionJson) throw new UnauthorizedException('세션이 만료됐어요. 다시 로그인해주세요.');

    const session: RedisSession = JSON.parse(sessionJson);
    const incomingHash = sha256(refreshToken);

    const isCurrent = incomingHash === session.rtHash;
    const isPrev = session.prevRtHash !== null && incomingHash === session.prevRtHash;
    const overlapExpired = Date.now() - session.rotatedAtEpoch > OVERLAP_WINDOW;

    if (!isCurrent && (!isPrev || overlapExpired)) {
      // 재사용 공격 감지 — 세션 전체 삭제
      await this.redis.del(redisKey(familyId));
      throw new UnauthorizedException('비정상적인 접근이 감지됐어요. 다시 로그인해주세요.');
    }

    const newJti = randomUUID();
    const newRefreshToken = randomBytes(64).toString('hex');

    const newSession: RedisSession = {
      ...session,
      currentAccessJti: newJti,
      rtHash: sha256(newRefreshToken),
      prevRtHash: session.rtHash,
      rotatedAtEpoch: Date.now(),
    };

    await this.redis.set(redisKey(familyId), JSON.stringify(newSession), REFRESH_TTL);

    const accessToken = this.jwtService.sign({ sub: session.userId, jti: newJti });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return { userId: session.userId, accessToken };
  }

  async logout(familyId: string, res: Response) {
    if (familyId) {
      await this.redis.del(redisKey(familyId));
    }
    res.clearCookie('refreshToken');
    res.clearCookie('familyId');
    return { message: '로그아웃 됐어요.' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없어요.');
    return user;
  }
}

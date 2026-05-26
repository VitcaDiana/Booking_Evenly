import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';
import { use } from 'passport';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    //hash parola
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    //salvez user

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  }

  async login(dto: LoginDto){
    //find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email},
    });

    if(!user){
      throw new UnauthorizedException('Invalid credentials');

    }
    //compare the password
    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if(!passwordMatch){
      throw new UnauthorizedException('Invalid credentials');
    }
    //generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);
    return{access_token};
  }
}

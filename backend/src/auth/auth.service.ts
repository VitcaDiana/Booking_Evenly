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


  //helpers 
  private async generateTokens(userId: number, email: string){
    const payload: JwtPayload = {sub : userId, email};

    const access_token = this.jwtService.sign(payload,
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      });

      const refresh_token = this.jwtService.sign(payload, 
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        });
        return {access_token, refresh_token};
  }

    private async saveRefreshToken(userId: number, refresh_token: string){
      const hashed = await bcrypt.hash(refresh_token, 10);
      await this.prisma.user.update({
        where: {id: userId},
        data: {refreshToken: hashed},
      });
    }


    //endpoints

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

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }
  async refresh(userId: number, refreshToken: string){
    const user = await this.prisma.user.findUnique({
      where: { id: userId},
    });
    if(!user || !user.refreshToken){
      throw new UnauthorizedException('Acess denied');
    }
    //check out if the refresh token from the request is the same as the one in db
    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if(!tokenMatch){
      throw new UnauthorizedException('Acess denied');
    }
    const tokens = await this.generateTokens(user.id,user.email);
    await this.saveRefreshToken(user.id,tokens.refresh_token);
    return tokens;
  }
  async logout(userId: number){
    await this.prisma.user.update({
      where: {id: userId},
      data: {refreshToken: null},
    });
    return {message: 'Logged out successfully'};
  }
  
   
  }


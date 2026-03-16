import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(data: Partial<User>) {
    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) throw new BadRequestException('User already exists');
    if (!data.passwordHash) throw new BadRequestException('Password is required');

    const user = this.userRepository.create(data);
    user.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    return this.userRepository.save(user);
  }

  async login(email: string, pass: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user);
  }

  async generateToken(user: User) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      portOverride: user.portOverride,
      logsAccess: user.logsAccess,
      financialView: user.financialView,
      iat: Math.floor(Date.now() / 1000) - 1200, // Backdate by 20 mins (drift is 8 mins) to avoid immediate expiration
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}

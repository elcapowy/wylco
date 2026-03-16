import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'super-secret-key-123',
    });
  }

  // Note: Clock skew compensation
  // We manually check or rely on underlying library tolerance if possible.
  // Actually, standard jsonwebtoken has no clockTolerance in StrategyOptions for passport-jwt directly.
  // We'll fix it in sign instead.

  async validate(payload: any) {
    return { 
      id: payload.sub, 
      email: payload.email, 
      role: payload.role,
      portOverride: payload.portOverride,
      logsAccess: payload.logsAccess,
      financialView: payload.financialView
    };
  }
}

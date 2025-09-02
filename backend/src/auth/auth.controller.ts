import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
class LinkIdentityDto {
  user_id!: string;
  provider!: string;
  issuer!: string;
  subject!: string;
  audience?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('link-identity')
  async linkIdentity(@Body() dto: LinkIdentityDto) {
    const identity = await this.auth.linkIdentityToUser({
      user_id: dto.user_id,
      provider: dto.provider,
      issuer: dto.issuer,
      subject: dto.subject,
      audience: dto.audience,
      email: dto.email,
      email_verified: dto.email_verified,
      name: dto.name,
    });
    return { message: 'Identity linked successfully.', identity_id: identity.id };
  }
}

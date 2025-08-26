import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

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

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Request() req: any) {
    return {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      roles: req.user.roles ?? [],
      permissions: req.user.permissions ?? [],
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('link-identity')
  async linkIdentity(@Body() dto: LinkIdentityDto, @Request() req: any) {
    if (dto.user_id !== req.user.id) {
      throw new ForbiddenException('You can only link your own identity.');
    }
    return { message: 'Stub: implement linkIdentityToUser or use admin flow' };
  }
}

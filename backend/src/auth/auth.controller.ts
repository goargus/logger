import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

class LinkIdentityDto {
  @ApiProperty({ description: 'User ID to link the identity to' })
  user_id!: string;

  @ApiProperty({ description: 'Identity provider name (e.g., auth0, google)' })
  provider!: string;

  @ApiProperty({ description: 'Identity provider issuer URL' })
  issuer!: string;

  @ApiProperty({ description: 'Subject identifier from the identity provider' })
  subject!: string;

  @ApiProperty({ description: 'Audience for the identity', required: false })
  audience?: string;

  @ApiProperty({ description: 'Email from the identity provider', required: false })
  email?: string;

  @ApiProperty({ description: 'Whether email is verified', required: false })
  email_verified?: boolean;

  @ApiProperty({ description: 'Display name from the identity provider', required: false })
  name?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('link-identity')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Link an identity provider to a user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Identity linked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
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

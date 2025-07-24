import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('private')
export class PrivateController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getPrivateData() {
    return { message: 'This is a protected endpoint' };
  }
}

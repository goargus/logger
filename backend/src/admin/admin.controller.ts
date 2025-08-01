import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @Roles('admin')
  getDashboard() {
    return { message: 'Welcome to admin dashboard' };
  }
}

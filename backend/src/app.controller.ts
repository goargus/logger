import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRootMessage() {
    return {
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    };
  }
}
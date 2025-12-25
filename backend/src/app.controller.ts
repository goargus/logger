import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getRootMessage() {
    return {
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    };
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      response.status(status).json(responseBody);
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const timestamp = new Date().toISOString();
    const path = request?.originalUrl ?? request?.url ?? 'unknown';
    const method = request?.method ?? 'UNKNOWN';
    const userId = request?.user?.id ?? request?.user?.sub ?? 'anonymous';
    const errorMessage = exception instanceof Error ? exception.message : String(exception);
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `Unhandled exception ${method} ${path} userId=${userId} error=${errorMessage}`,
      errorStack,
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const body: Record<string, unknown> = {
      statusCode: status,
      message: 'Internal server error',
      timestamp,
      path,
    };

    if (!isProduction) {
      body.error = errorMessage;
    }

    response.status(status).json(body);
  }
}

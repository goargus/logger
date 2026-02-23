import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let response: { status: jest.Mock; json: jest.Mock };
  let request: { method: string; originalUrl?: string; url?: string; user?: any };
  let host: ArgumentsHost;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    request = {
      method: 'POST',
      originalUrl: '/activities',
      user: { id: 'user-1' },
    };

    host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('passes through HttpExceptions with original status and message', () => {
    const exception = new BadRequestException('Invalid payload');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid payload' }),
    );
  });

  it('returns sanitized 500 in production without internal details', () => {
    process.env.NODE_ENV = 'production';
    const exception = new Error('duplicate key value violates unique constraint');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(500);
    const body = response.json.mock.calls[0][0];
    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        path: '/activities',
      }),
    );
    expect(body.error).toBeUndefined();
  });

  it('includes the real error message in development responses', () => {
    process.env.NODE_ENV = 'development';
    const exception = new Error('duplicate key value violates unique constraint');

    filter.catch(exception, host);

    const body = response.json.mock.calls[0][0];
    expect(body.error).toBe('duplicate key value violates unique constraint');
  });

  it('logs full error details with request context', () => {
    process.env.NODE_ENV = 'production';
    const exception = new Error('boom');
    const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    filter.catch(exception, host);

    expect(logSpy).toHaveBeenCalled();
    const [message, trace] = logSpy.mock.calls[0];
    expect(message).toContain('POST /activities');
    expect(message).toContain('userId=user-1');
    expect(trace).toBe(exception.stack);
  });
});

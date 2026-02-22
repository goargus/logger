import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { TypeOrmHealthIndicator, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('HealthController', () => {
  let controller: HealthController;
  let dbIndicator: jest.Mocked<TypeOrmHealthIndicator>;
  let httpIndicator: jest.Mocked<HttpHealthIndicator>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: TypeOrmHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
        {
          provide: HttpHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<HealthController>(HealthController);
    dbIndicator = module.get(TypeOrmHealthIndicator);
    httpIndicator = module.get(HttpHealthIndicator);
    configService = module.get(ConfigService);
  });

  const setIssuer = (issuer = 'https://issuer.example.com/') => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'auth.issuer') return issuer;
      return undefined;
    });
  };

  it('returns ok when database is healthy', async () => {
    dbIndicator.pingCheck.mockResolvedValue({ database: { status: 'up' } });

    const result = await controller.getHealth();

    expect(result).toEqual({ status: 'ok' });
    expect(dbIndicator.pingCheck).toHaveBeenCalledWith('database', { timeout: 1000 });
  });

  it('returns 503 when database is unhealthy', async () => {
    dbIndicator.pingCheck.mockRejectedValue(new Error('db down'));

    await expect(controller.getHealth()).rejects.toThrow(HttpException);
    await expect(controller.getHealth()).rejects.toMatchObject({
      response: { status: 'error' },
    });
  });

  it('returns admin details with response times and uptime', async () => {
    setIssuer();
    dbIndicator.pingCheck.mockResolvedValue({ database: { status: 'up' } });
    httpIndicator.pingCheck.mockResolvedValue({ jwks: { status: 'up' } });

    // Promise.all interleaves: db-start, jwks-start, db-end, jwks-end
    jest
      .spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000)
      .mockReturnValueOnce(1012)
      .mockReturnValueOnce(2025);
    jest.spyOn(process, 'uptime').mockReturnValue(86400);

    const result = await controller.getAdminHealth();

    expect(result.status).toBe('ok');
    expect(result.details.database).toEqual({ status: 'up', responseTime: '12ms' });
    expect(result.details.jwks).toEqual({ status: 'up', responseTime: '25ms' });
    expect(result.details.uptime).toBe(86400);
  });
});

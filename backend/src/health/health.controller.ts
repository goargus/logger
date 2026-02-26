import { Controller, Get, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Roles } from '../auth/roles.decorator';

type DependencyStatus = {
  status: 'up' | 'down';
  responseTime?: string;
  error?: string;
};

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly dbIndicator: TypeOrmHealthIndicator,
    private readonly httpIndicator: HttpHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  private ensureTrailingSlash(url?: string): string | undefined {
    if (!url) return undefined;
    return url.endsWith('/') ? url : `${url}/`;
  }

  private firstDefined<T>(...getters: Array<() => T | undefined | null>): T | undefined {
    for (const g of getters) {
      const v = g();
      if (v !== undefined && v !== null && v !== '') return v as T;
    }
    return undefined;
  }

  private resolveJwksUri(): string | undefined {
    const issuerFromCfg =
      this.firstDefined<string>(
        () => this.config.get<string>('auth.issuer'),
        () => this.config.get<string>('AUTH0_ISSUER'),
        () => this.config.get<string>('AUTH_ISSUER'),
        () => {
          const domain = this.config.get<string>('AUTH0_DOMAIN');
          return domain ? `https://${domain}/` : undefined;
        },
      ) || '';

    const issuer = this.ensureTrailingSlash(issuerFromCfg);
    return issuer ? `${issuer}.well-known/jwks.json` : undefined;
  }

  private toErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    return 'Unknown error';
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    const start = Date.now();
    try {
      await this.dbIndicator.pingCheck('database', { timeout: 1000 });
      const responseTime = Date.now() - start;
      return { status: 'up', responseTime: `${responseTime}ms` };
    } catch (err) {
      return { status: 'down', error: this.toErrorMessage(err) };
    }
  }

  private async checkJwks(): Promise<DependencyStatus> {
    const jwksUri = this.resolveJwksUri();
    if (!jwksUri) {
      return { status: 'down', error: 'JWKS issuer not configured' };
    }

    const start = Date.now();
    try {
      await this.httpIndicator.pingCheck('jwks', jwksUri, { timeout: 1000 });
      const responseTime = Date.now() - start;
      return { status: 'up', responseTime: `${responseTime}ms` };
    } catch (err) {
      return { status: 'down', error: this.toErrorMessage(err) };
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Public health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async getHealth() {
    const database = await this.checkDatabase();

    if (database.status !== 'up') {
      throw new HttpException({ status: 'error' }, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return { status: 'ok' };
  }

  @Get('admin/health')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Admin health check with details' })
  @ApiResponse({ status: 200, description: 'Detailed dependency status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin permission' })
  @ApiResponse({ status: 503, description: 'Dependency check failed' })
  async getAdminHealth() {
    const [database, jwks] = await Promise.all([this.checkDatabase(), this.checkJwks()]);
    const uptime = Math.floor(process.uptime());
    const isHealthy = database.status === 'up' && jwks.status === 'up';
    const response = {
      status: isHealthy ? 'ok' : 'error',
      details: { database, jwks, uptime },
    };

    if (!isHealthy) {
      throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return response;
  }
}

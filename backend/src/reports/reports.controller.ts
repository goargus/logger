import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportQueryDto, RankingsQueryDto } from './dto/report-query.dto';
import {
  SummaryResponse,
  BreakdownsResponse,
  ComplianceResponse,
  TrendsResponse,
  ComparisonResponse,
  RankingsResponse,
  ExpensesResponse,
} from './dto/report-responses.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { Request } from 'express';
import { JwtValidatedUser } from '../auth/jwt.strategy';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly identityService: IdentityResolutionService,
  ) {}

  private async getUserIdFromRequest(req: Request): Promise<string> {
    const { sub, iss } = (req.user as JwtValidatedUser) ?? {};
    const user = await this.identityService.resolveUserBySubAndIssuer(sub, iss);
    return user.id;
  }

  @Get('summary')
  async getSummary(@Req() req: Request, @Query() query: ReportQueryDto): Promise<SummaryResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getSummary(userId, query);
  }

  @Get('breakdowns')
  async getBreakdowns(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<BreakdownsResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getBreakdowns(userId, query);
  }

  @Get('compliance')
  async getCompliance(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ComplianceResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getCompliance(userId, query);
  }

  @Get('trends')
  async getTrends(@Req() req: Request, @Query() query: ReportQueryDto): Promise<TrendsResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getTrends(userId, query);
  }

  @Get('comparison')
  async getComparison(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ComparisonResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getComparison(userId, query);
  }

  @Get('rankings')
  async getRankings(
    @Req() req: Request,
    @Query() query: RankingsQueryDto,
  ): Promise<RankingsResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getRankings(userId, query);
  }

  @Get('expenses')
  async getExpenses(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ExpensesResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getExpenses(userId, query);
  }
}

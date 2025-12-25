import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  BreakdownsComparisonResponse,
} from './dto/report-responses.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdentityResolutionService } from '../auth/identity-resolution.service';
import { Request } from 'express';
import { JwtValidatedUser } from '../auth/jwt.strategy';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get activity summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary statistics for the period' })
  async getSummary(@Req() req: Request, @Query() query: ReportQueryDto): Promise<SummaryResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getSummary(userId, query);
  }

  @Get('breakdowns')
  @ApiOperation({ summary: 'Get activity breakdowns by type, entity, and user' })
  @ApiResponse({ status: 200, description: 'Breakdown statistics' })
  async getBreakdowns(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<BreakdownsResponse | BreakdownsComparisonResponse> {
    const userId = await this.getUserIdFromRequest(req);

    if (query.includeComparison && query.periodType) {
      return this.reportsService.getBreakdownsWithComparison(userId, query);
    }

    return this.reportsService.getBreakdowns(userId, query);
  }

  @Get('compliance')
  @ApiOperation({ summary: 'Get compliance report (submitted vs not submitted users)' })
  @ApiResponse({ status: 200, description: 'Compliance statistics' })
  async getCompliance(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ComplianceResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getCompliance(userId, query);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get activity trends over multiple periods' })
  @ApiResponse({ status: 200, description: 'Trend data across periods' })
  async getTrends(@Req() req: Request, @Query() query: ReportQueryDto): Promise<TrendsResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getTrends(userId, query);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Compare current period with previous period' })
  @ApiResponse({ status: 200, description: 'Period comparison with changes' })
  async getComparison(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ComparisonResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getComparison(userId, query);
  }

  @Get('rankings')
  @ApiOperation({ summary: 'Get top performers, lowest compliance, and inactive users' })
  @ApiResponse({ status: 200, description: 'Ranking data' })
  async getRankings(
    @Req() req: Request,
    @Query() query: RankingsQueryDto,
  ): Promise<RankingsResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getRankings(userId, query);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get expense breakdown by type, entity, and user' })
  @ApiResponse({ status: 200, description: 'Expense statistics' })
  async getExpenses(
    @Req() req: Request,
    @Query() query: ReportQueryDto,
  ): Promise<ExpensesResponse> {
    const userId = await this.getUserIdFromRequest(req);
    return this.reportsService.getExpenses(userId, query);
  }
}

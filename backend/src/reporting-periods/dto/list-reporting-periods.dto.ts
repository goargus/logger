import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListReportingPeriodsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by entity UUID' })
  @IsOptional()
  @IsUUID()
  entityId?: string;
}

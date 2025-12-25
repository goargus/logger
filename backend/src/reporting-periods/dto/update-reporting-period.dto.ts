import { PartialType } from '@nestjs/swagger';
import { CreateReportingPeriodDto } from './create-reporting-period.dto';

export class UpdateReportingPeriodDto extends PartialType(CreateReportingPeriodDto) {}

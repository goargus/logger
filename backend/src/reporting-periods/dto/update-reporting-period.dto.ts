import { PartialType } from '@nestjs/mapped-types';
import { CreateReportingPeriodDto } from './create-reporting-period.dto';

export class UpdateReportingPeriodDto extends PartialType(CreateReportingPeriodDto) {}

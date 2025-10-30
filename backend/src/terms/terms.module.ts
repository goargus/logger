import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Term } from './term.entity';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';
import { Entity } from '../entities/entity.entity';
import { ReportingPeriodsModule } from '../reporting-periods/reporting-periods.module';

@Module({
  imports: [TypeOrmModule.forFeature([Term, Entity]), forwardRef(() => ReportingPeriodsModule)],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}

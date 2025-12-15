import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entity } from './entity.entity';
import { EntitiesService } from './entities.service';
import { EntitiesController } from './entities.controller';
import { HierarchyValidationService } from './hierarchy-validation.service';
import { User } from '../users/user.entity';
import { ReportingPeriodsModule } from '../reporting-periods/reporting-periods.module';
import { TermsModule } from '../terms/terms.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entity, User]),
    forwardRef(() => ReportingPeriodsModule),
    forwardRef(() => TermsModule),
    CaslModule,
  ],
  controllers: [EntitiesController],
  providers: [EntitiesService, HierarchyValidationService],
  exports: [EntitiesService, HierarchyValidationService],
})
export class EntitiesModule {}

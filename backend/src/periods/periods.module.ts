import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminLock } from './admin-lock.entity';
import { PeriodException } from './period-exception.entity';
import { PeriodCalculator } from './period-calculator';
import { LockService } from './lock.service';
import { PeriodsController } from './periods.controller';
import { AuthModule } from '../auth/auth.modules';

@Module({
  imports: [TypeOrmModule.forFeature([AdminLock, PeriodException]), AuthModule],
  controllers: [PeriodsController],
  providers: [
    {
      provide: PeriodCalculator,
      useFactory: () => {
        const frequency = parseInt(process.env.PERIOD_FREQUENCY ?? '2', 10);
        return new PeriodCalculator(frequency);
      },
    },
    LockService,
  ],
  exports: [LockService, PeriodCalculator],
})
export class PeriodsModule {}

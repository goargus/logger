import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnionsController } from './unions.controller';
import { UnionsService } from './unions.service';
import { Union } from './entities/union.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Union])],
  controllers: [UnionsController],
  providers: [UnionsService],
})
export class UnionsModule {}

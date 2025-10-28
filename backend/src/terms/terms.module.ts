import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Term } from './term.entity';
import { Entity as OrganizationalEntity } from '../entities/entity.entity';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Term, OrganizationalEntity])],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}

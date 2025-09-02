import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdpIdentity } from './idp-identity.entity';
import { IdpIdentitiesService } from './idp-identities.service';

@Module({
  imports: [TypeOrmModule.forFeature([IdpIdentity])],
  providers: [IdpIdentitiesService],
  exports: [IdpIdentitiesService, TypeOrmModule],
})
export class IdpIdentitiesModule {}

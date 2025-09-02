import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdpIdentity } from '../idp-identities/idp-identity.entity';
import { User } from '../users/user.entity';

@Injectable()
export class IdentityResolutionService {
  constructor(
    @InjectRepository(IdpIdentity) private readonly idpRepo: Repository<IdpIdentity>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async resolveUserBySubAndIssuer(sub: string | undefined, iss?: string): Promise<User> {
    if (!sub) {
      throw new UnauthorizedException('Missing sub in token.');
    }

    const where = iss ? { issuer: iss, subject: sub } : { subject: sub };

    const idp = await this.idpRepo.findOne({
      where,
      relations: ['user'],
    });

    if (!idp?.user) {
      throw new UnauthorizedException('No linked user for this identity (subject/issuer).');
    }
    return idp.user;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdpIdentity } from './idp-identity.entity';

@Injectable()
export class IdpIdentitiesService {
  constructor(
    @InjectRepository(IdpIdentity)
    private readonly idpIdentityRepo: Repository<IdpIdentity>,
  ) { }

  async findByIssuerAndSubject(issuer: string, subject: string): Promise<IdpIdentity | null> {
    return this.idpIdentityRepo.findOne({
      where: { issuer, subject },
      relations: { user: true },
    });
  }

  async create(data: Partial<IdpIdentity>): Promise<IdpIdentity> {
    const identity = this.idpIdentityRepo.create(data);
    return this.idpIdentityRepo.save(identity);
  }

  async save(identity: IdpIdentity): Promise<IdpIdentity> {
    return this.idpIdentityRepo.save(identity);
  }
}
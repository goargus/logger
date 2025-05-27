import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Union } from './entities/union.entity';
import { CreateUnionDto } from './dto/create-union.dto';
import { UpdateUnionDto } from './dto/update-union.dto';

@Injectable()
export class UnionsService {
  constructor(
    @InjectRepository(Union)
    private unionRepo: Repository<Union>,
  ) {}

  create(dto: CreateUnionDto) {
    const union = this.unionRepo.create(dto);
    return this.unionRepo.save(union);
  }

  findAll() {
    return this.unionRepo.find();
  }

  findOne(id: string) {
    return this.unionRepo.findOne({
      where: { id },
      relations: ['associations'],
    });
  }

  async update(id: string, dto: UpdateUnionDto) {
    await this.unionRepo.update(id, dto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.unionRepo.delete(id);
  }
}

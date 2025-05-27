import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Association } from './entities/association.entity';
import { CreateAssociationDto } from './dto/create-association.dto';
import { UpdateAssociationDto } from './dto/update-association.dto';
import { Union } from '../../unions/entities/union.entity';

@Injectable()
export class AssociationsService {
  constructor(
    @InjectRepository(Association)
    private associationRepo: Repository<Association>,
  ) {}

  async create(createDto: CreateAssociationDto) {
    const association = this.associationRepo.create({
      name: createDto.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      union: { id: createDto.unionId } as Union, // 🔗 vincula la relación
    });

    return this.associationRepo.save(association);
  }

  findAll() {
    return this.associationRepo.find({ relations: ['union'] });
  }

  findOne(id: string) {
    return this.associationRepo.findOne({
      where: { id },
      relations: ['union'],
    });
  }

  async update(id: string, updateDto: UpdateAssociationDto) {
    await this.associationRepo.update(id, updateDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.associationRepo.delete(id);
  }
}

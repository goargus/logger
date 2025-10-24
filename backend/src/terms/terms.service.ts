import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from './term.entity';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { Entity as OrganizationalEntity } from '../entities/entity.entity';

@Injectable()
export class TermsService {
  constructor(
    @InjectRepository(Term)
    private readonly termRepository: Repository<Term>,
    @InjectRepository(OrganizationalEntity)
    private readonly entityRepository: Repository<OrganizationalEntity>,
  ) {}

  async create(createTermDto: CreateTermDto): Promise<Term> {
    const entity = await this.entityRepository.findOne({
      where: { id: createTermDto.entity_id },
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${createTermDto.entity_id} not found`);
    }

    if (createTermDto.end_date) {
      const startDate = new Date(createTermDto.start_date);
      const endDate = new Date(createTermDto.end_date);
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const term = this.termRepository.create({
      ...createTermDto,
      start_date: new Date(createTermDto.start_date),
      end_date: createTermDto.end_date ? new Date(createTermDto.end_date) : undefined,
    });

    return await this.termRepository.save(term);
  }

  async findAll(entityId?: string): Promise<Term[]> {
    const queryBuilder = this.termRepository
      .createQueryBuilder('term')
      .leftJoinAndSelect('term.entity', 'entity')
      .orderBy('term.start_date', 'DESC');

    if (entityId) {
      queryBuilder.where('term.entity_id = :entityId', { entityId });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Term> {
    const term = await this.termRepository.findOne({
      where: { id },
      relations: ['entity'],
    });

    if (!term) {
      throw new NotFoundException(`Term with ID ${id} not found`);
    }

    return term;
  }

  async update(id: string, updateTermDto: UpdateTermDto): Promise<Term> {
    const term = await this.findOne(id);

    if (updateTermDto.start_date || updateTermDto.end_date) {
      const startDate = new Date(updateTermDto.start_date || term.start_date);
      const endDate = updateTermDto.end_date ? new Date(updateTermDto.end_date) : term.end_date;

      if (endDate && startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    if (updateTermDto.is_active !== undefined) {
      if (updateTermDto.is_active) {
        await this.deactivateOtherTerms(term.entity_id, id);
      }
    }

    Object.assign(term, {
      ...updateTermDto,
      start_date: updateTermDto.start_date ? new Date(updateTermDto.start_date) : term.start_date,
      end_date: updateTermDto.end_date ? new Date(updateTermDto.end_date) : term.end_date,
    });

    return await this.termRepository.save(term);
  }

  async remove(id: string): Promise<void> {
    const term = await this.findOne(id);
    await this.termRepository.remove(term);
  }

  async activateTerm(id: string): Promise<Term> {
    const term = await this.findOne(id);
    await this.deactivateOtherTerms(term.entity_id, id);
    term.is_active = true;
    return await this.termRepository.save(term);
  }

  async deactivateTerm(id: string): Promise<Term> {
    const term = await this.findOne(id);
    term.is_active = false;
    return await this.termRepository.save(term);
  }

  private async deactivateOtherTerms(entityId: string, excludeTermId: string): Promise<void> {
    await this.termRepository
      .createQueryBuilder()
      .update(Term)
      .set({ is_active: false })
      .where('entity_id = :entityId', { entityId })
      .andWhere('id != :excludeTermId', { excludeTermId })
      .andWhere('is_active = true')
      .execute();
  }

  async getActiveTermForEntity(entityId: string): Promise<Term | null> {
    return await this.termRepository.findOne({
      where: { entity_id: entityId, is_active: true },
      relations: ['entity'],
    });
  }
}

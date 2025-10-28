import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportingPeriod } from './reporting-period.entity';
import { CreateReportingPeriodDto } from './dto/create-reporting-period.dto';
import { UpdateReportingPeriodDto } from './dto/update-reporting-period.dto';
import { ReportingPeriodStatus } from './reporting-period-status.enum';

@Injectable()
export class ReportingPeriodsService {
  constructor(
    @InjectRepository(ReportingPeriod)
    private readonly repo: Repository<ReportingPeriod>,
  ) {}

  async create(dto: CreateReportingPeriodDto, actorUserId: string): Promise<ReportingPeriod> {
    if (dto.startDate >= dto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const overlapping = await this.repo
      .createQueryBuilder('period')
      .where('(period.startDate <= :endDate AND period.endDate >= :startDate)', {
        startDate: dto.startDate,
        endDate: dto.endDate,
      })
      .getOne();

    if (overlapping) {
      throw new ConflictException(
        `Period overlaps with existing period "${overlapping.name}" (${overlapping.startDate} - ${overlapping.endDate})`,
      );
    }

    const entity = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status ?? ReportingPeriodStatus.ACTIVE,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    return this.repo.save(entity);
  }

  async findAll(): Promise<ReportingPeriod[]> {
    return this.repo.find({
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ReportingPeriod> {
    const period = await this.repo.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException('Reporting period not found');
    }
    return period;
  }

  async findByDate(date: string): Promise<ReportingPeriod | null> {
    return this.repo
      .createQueryBuilder('period')
      .where('period.startDate <= :date AND period.endDate >= :date', { date })
      .getOne();
  }

  async update(
    id: string,
    dto: UpdateReportingPeriodDto,
    actorUserId: string,
  ): Promise<ReportingPeriod> {
    const period = await this.findOne(id);

    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const startDate = dto.startDate ?? period.startDate;
    const endDate = dto.endDate ?? period.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    if (dto.startDate || dto.endDate) {
      const overlapping = await this.repo
        .createQueryBuilder('period')
        .where(
          '(period.startDate <= :endDate AND period.endDate >= :startDate) AND period.id != :id',
          { startDate, endDate, id },
        )
        .getOne();

      if (overlapping) {
        throw new ConflictException(
          `Period would overlap with existing period "${overlapping.name}" (${overlapping.startDate} - ${overlapping.endDate})`,
        );
      }
    }

    Object.assign(period, {
      ...dto,
      updatedBy: actorUserId,
    });

    return this.repo.save(period);
  }

  async lock(id: string, actorUserId: string): Promise<ReportingPeriod> {
    const period = await this.findOne(id);

    if (period.status === ReportingPeriodStatus.LOCKED) {
      throw new BadRequestException('Reporting period is already locked');
    }

    period.status = ReportingPeriodStatus.LOCKED;
    period.updatedBy = actorUserId;

    return this.repo.save(period);
  }

  async unlock(id: string, actorUserId: string): Promise<ReportingPeriod> {
    const period = await this.findOne(id);

    if (period.status === ReportingPeriodStatus.ACTIVE) {
      throw new BadRequestException('Reporting period is already active');
    }

    period.status = ReportingPeriodStatus.ACTIVE;
    period.updatedBy = actorUserId;

    return this.repo.save(period);
  }

  async remove(id: string): Promise<void> {
    const period = await this.findOne(id);
    const activitiesCount = await this.repo
      .createQueryBuilder('period')
      .leftJoin('period.activities', 'activity')
      .where('period.id = :id', { id })
      .getCount();

    if (activitiesCount > 0) {
      throw new BadRequestException(
        'Cannot delete reporting period: it has associated activities. Please reassign or remove activities first.',
      );
    }

    await this.repo.remove(period);
  }
}

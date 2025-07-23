import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Repository } from 'typeorm';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepo: Repository<Activity>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  private lockOldActivities(activities: Activity[]) {
    const now = new Date();
    for (const activity of activities) {
      const date = new Date(activity.date);
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 14 && !activity.is_locked) {
        activity.is_locked = true;
      }
    }
    return activities;
  }

  async create(createDto: CreateActivityDto, user: User): Promise<Activity> {
    const category = await this.categoryRepo.findOneBy({ id: createDto.category_id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const activity = this.activityRepo.create({
      ...createDto,
      user,
      category,
      is_locked: false,
    });

    return this.activityRepo.save(activity);
  }

  async findAll(
    user: User,
    filters: { category_id?: string; start?: string; end?: string },
  ): Promise<Activity[]> {
    const query = this.activityRepo
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.category', 'category')
      .where('activity.userId = :userId', { userId: user.id });

    if (filters.category_id) {
      query.andWhere('activity.categoryId = :categoryId', { categoryId: filters.category_id });
    }

    if (filters.start) {
      query.andWhere('activity.date >= :start', { start: filters.start });
    }

    if (filters.end) {
      query.andWhere('activity.date <= :end', { end: filters.end });
    }

    const activities = await query.orderBy('activity.date', 'DESC').getMany();
    return this.lockOldActivities(activities);
  }

  async update(id: string, updateDto: UpdateActivityDto, user: User): Promise<Activity> {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!activity || activity.user.id !== user.id) {
      throw new NotFoundException('Activity not found');
    }

    if (activity.is_locked) {
      throw new ForbiddenException('Activity is locked and cannot be updated');
    }

    if (updateDto.category_id) {
      const newCategory = await this.categoryRepo.findOneBy({ id: updateDto.category_id });
      if (!newCategory) throw new NotFoundException('Category not found');
      activity.category = newCategory;
    }

    if (updateDto.date) activity.date = updateDto.date;
    if (updateDto.description !== undefined) activity.description = updateDto.description;

    return this.activityRepo.save(activity);
  }

  async remove(id: string, user: User): Promise<void> {
    const activity = await this.activityRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!activity || activity.user.id !== user.id) {
      throw new NotFoundException('Activity not found');
    }

    if (activity.is_locked) {
      throw new ForbiddenException('Activity is locked and cannot be deleted');
    }

    await this.activityRepo.remove(activity);
  }
}

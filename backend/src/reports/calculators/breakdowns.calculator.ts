import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { UserStatus } from '../../users/user-status.enum';
import { BreakdownsResponse } from '../dto/report-responses.dto';

@Injectable()
export class BreakdownsCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(
    activities: Activity[],
    canViewReports: boolean,
    isUserFiltered: boolean,
  ): Promise<BreakdownsResponse> {
    const typeMap = new Map<string, { name: string; count: number; expenses: number }>();
    for (const activity of activities) {
      const typeId = activity.activityTypeId;
      const typeName = activity.activityType.name;
      const existing = typeMap.get(typeId) || { name: typeName, count: 0, expenses: 0 };
      existing.count++;
      existing.expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
      typeMap.set(typeId, existing);
    }

    const byType = Array.from(typeMap.entries()).map(([typeId, data]) => ({
      typeId,
      name: data.name,
      count: data.count,
      expenses: Math.round(data.expenses * 100) / 100,
    }));

    const byEntity: Array<{
      entityId: string;
      name: string;
      type: string;
      count: number;
      expenses: number;
      compliance: { submitted: number; total: number };
    }> = [];
    if (canViewReports && !isUserFiltered) {
      const entityMap = new Map<
        string,
        { name: string; type: string; count: number; expenses: number }
      >();
      for (const activity of activities) {
        const entityId = activity.user.entity_id;
        const entity = activity.user.entity;
        const existing = entityMap.get(entityId) || {
          name: entity.name,
          type: entity.type,
          count: 0,
          expenses: 0,
        };
        existing.count++;
        existing.expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
        entityMap.set(entityId, existing);
      }

      const entityIds = Array.from(entityMap.keys());
      const allUsers = await this.userRepo.find({
        where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
      });

      const usersByEntity = new Map<string, User[]>();
      for (const user of allUsers) {
        if (!usersByEntity.has(user.entity_id)) {
          usersByEntity.set(user.entity_id, []);
        }
        const entityUsers = usersByEntity.get(user.entity_id);
        if (entityUsers) {
          entityUsers.push(user);
        }
      }

      for (const [entityId, data] of entityMap.entries()) {
        const usersInEntity = usersByEntity.get(entityId) || [];
        const userIdsInEntity = usersInEntity.map((u) => u.id);
        const usersSubmitted = new Set(
          activities.filter((a) => userIdsInEntity.includes(a.userId)).map((a) => a.userId),
        ).size;

        byEntity.push({
          entityId,
          name: data.name,
          type: data.type,
          count: data.count,
          expenses: Math.round(data.expenses * 100) / 100,
          compliance: {
            submitted: usersSubmitted,
            total: usersInEntity.length,
          },
        });
      }
    }

    const userMap = new Map<string, { name: string; count: number; expenses: number }>();
    for (const activity of activities) {
      const userId = activity.userId;
      const userName = activity.user.full_name || activity.user.username;
      const existing = userMap.get(userId) || { name: userName, count: 0, expenses: 0 };
      existing.count++;
      existing.expenses += activity.expenseAmount ? parseFloat(activity.expenseAmount) : 0;
      userMap.set(userId, existing);
    }

    const byUser = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      name: data.name,
      count: data.count,
      expenses: Math.round(data.expenses * 100) / 100,
    }));

    return { byType, byEntity, byUser };
  }
}

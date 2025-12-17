import { Injectable } from '@nestjs/common';
import { Activity } from '../../activity/activity.entity';
import { ExpensesResponse } from '../dto/report-responses.dto';

@Injectable()
export class ExpensesCalculator {
  async calculate(
    activities: Activity[],
    canViewReports: boolean,
    isUserFiltered: boolean,
  ): Promise<ExpensesResponse> {
    const totalExpenses = activities.reduce((sum, a) => {
      return sum + (a.expenseAmount ? parseFloat(a.expenseAmount) : 0);
    }, 0);

    const typeMap = new Map<string, { name: string; total: number; count: number }>();
    for (const activity of activities) {
      if (activity.expenseAmount) {
        const typeId = activity.activityTypeId;
        const typeName = activity.activityType.name;
        const existing = typeMap.get(typeId) || { name: typeName, total: 0, count: 0 };
        existing.total += parseFloat(activity.expenseAmount);
        existing.count++;
        typeMap.set(typeId, existing);
      }
    }

    const byType = Array.from(typeMap.entries()).map(([typeId, data]) => ({
      typeId,
      name: data.name,
      total: Math.round(data.total * 100) / 100,
      percent: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 10000) / 100 : 0,
      avgPerActivity: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
    }));

    const byEntity: Array<{
      entityId: string;
      name: string;
      total: number;
      percent: number;
      perUser: number;
    }> = [];
    if (canViewReports && !isUserFiltered) {
      const entityMap = new Map<string, { name: string; total: number; userIds: Set<string> }>();
      for (const activity of activities) {
        if (activity.expenseAmount) {
          const entityId = activity.user.entity_id;
          const entityName = activity.user.entity.name;
          const existing = entityMap.get(entityId) || {
            name: entityName,
            total: 0,
            userIds: new Set(),
          };
          existing.total += parseFloat(activity.expenseAmount);
          existing.userIds.add(activity.userId);
          entityMap.set(entityId, existing);
        }
      }

      for (const [entityId, data] of entityMap.entries()) {
        byEntity.push({
          entityId,
          name: data.name,
          total: Math.round(data.total * 100) / 100,
          percent: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 10000) / 100 : 0,
          perUser:
            data.userIds.size > 0 ? Math.round((data.total / data.userIds.size) * 100) / 100 : 0,
        });
      }
    }

    const userMap = new Map<string, { name: string; total: number }>();
    for (const activity of activities) {
      if (activity.expenseAmount) {
        const userId = activity.userId;
        const userName = activity.user.full_name || activity.user.username;
        const existing = userMap.get(userId) || { name: userName, total: 0 };
        existing.total += parseFloat(activity.expenseAmount);
        userMap.set(userId, existing);
      }
    }

    const byUser = Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      name: data.name,
      total: Math.round(data.total * 100) / 100,
      percent: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 10000) / 100 : 0,
    }));

    return {
      total: Math.round(totalExpenses * 100) / 100,
      byType,
      byEntity,
      byUser,
    };
  }
}

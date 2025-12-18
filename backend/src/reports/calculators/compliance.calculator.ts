import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity } from '../../activity/activity.entity';
import { User } from '../../users/user.entity';
import { UserStatus } from '../../users/user-status.enum';
import { ComplianceResponse } from '../dto/report-responses.dto';

@Injectable()
export class ComplianceCalculator {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async calculate(activities: Activity[], entityIds: string[]): Promise<ComplianceResponse> {
    const usersInScope = await this.userRepo.find({
      where: { entity_id: In(entityIds), status: UserStatus.ACTIVE },
      relations: ['entity'],
    });

    const userIdsWithActivities = new Set(activities.map((a) => a.userId));

    const submittedUsers = usersInScope
      .filter((u) => userIdsWithActivities.has(u.id))
      .map((u) => {
        const userActivities = activities.filter((a) => a.userId === u.id);
        const lastActivity = userActivities.reduce((latest, a) => {
          return a.activityDate > latest ? a.activityDate : latest;
        }, '');

        return {
          userId: u.id,
          name: u.full_name || u.username,
          count: userActivities.length,
          lastActivity,
        };
      });

    const notSubmittedUsersList = usersInScope.filter((u) => !userIdsWithActivities.has(u.id));

    const roleAssignmentsMap = new Map<string, string[]>();
    if (notSubmittedUsersList.length > 0) {
      const userIds = notSubmittedUsersList.map((u) => u.id);
      const allRoleAssignments = await this.userRepo.manager.query(
        `SELECT ura.user_id, r.name FROM user_role_assignment ura
         JOIN roles r ON ura.role_id = r.id
         WHERE ura.user_id = ANY($1)`,
        [userIds],
      );

      for (const assignment of allRoleAssignments) {
        if (!roleAssignmentsMap.has(assignment.user_id)) {
          roleAssignmentsMap.set(assignment.user_id, []);
        }
        const roles = roleAssignmentsMap.get(assignment.user_id);
        if (roles) {
          roles.push(assignment.name);
        }
      }
    }

    const notSubmittedUsers = notSubmittedUsersList.map((u) => ({
      userId: u.id,
      name: u.full_name || u.username,
      roles: roleAssignmentsMap.get(u.id) || [],
      entity: u.entity.name,
    }));

    return {
      submitted: submittedUsers,
      notSubmitted: notSubmittedUsers,
    };
  }
}

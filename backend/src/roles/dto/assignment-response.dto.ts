import { UserRoleAssignment } from '../user-role-assignment.entity';

export class AssignmentResponseDto {
  id!: string;
  userId!: string;
  username!: string;
  roleId!: string;
  roleName!: string;
  entityId!: string;
  entityName!: string;
  startDate!: string;
  endDate!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(assignment: UserRoleAssignment): AssignmentResponseDto {
    const dto = new AssignmentResponseDto();
    dto.id = assignment.id;
    dto.userId = assignment.user.id;
    dto.username = assignment.user.username;
    dto.roleId = assignment.role.id;
    dto.roleName = assignment.role.name;
    dto.entityId = assignment.entity.id;
    dto.entityName = assignment.entity.name;
    dto.startDate = assignment.start_date;
    dto.endDate = assignment.end_date;
    dto.isActive = assignment.isActive();
    dto.createdAt = assignment.created_at;
    dto.updatedAt = assignment.updated_at;
    return dto;
  }
}

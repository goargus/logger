import { UserRoleAssignment } from '../user-role-assignment.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AssignmentResponseDto {
  @ApiProperty({ description: 'Unique identifier of the assignment' })
  id!: string;

  @ApiProperty({ description: 'UUID of the user' })
  userId!: string;

  @ApiProperty({ description: 'Username of the assigned user' })
  username!: string;

  @ApiProperty({ description: 'UUID of the role' })
  roleId!: string;

  @ApiProperty({ description: 'Name of the role', example: 'MISSIONARY' })
  roleName!: string;

  @ApiProperty({ description: 'UUID of the entity' })
  entityId!: string;

  @ApiProperty({ description: 'Name of the entity' })
  entityName!: string;

  @ApiProperty({ description: 'Start date of the assignment', example: '2024-01-01' })
  startDate!: string;

  @ApiProperty({ description: 'End date of the assignment', example: '9999-12-31' })
  endDate!: string;

  @ApiProperty({ description: 'Whether the assignment is currently active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
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

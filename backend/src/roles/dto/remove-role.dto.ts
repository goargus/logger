import { IsUUID } from 'class-validator';

export class RemoveRoleDto {
  @IsUUID()
  assignmentId!: string;
}

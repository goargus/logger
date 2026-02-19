import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({
    description: 'UUID of the user to assign the role to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'UUID of the role to assign',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  roleId!: string;

  @ApiProperty({
    description: 'UUID of the entity where the role applies',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  entityId!: string;

  @ApiPropertyOptional({
    description: 'Start date for the role assignment',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

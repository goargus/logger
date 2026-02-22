import { IsUUID, IsArray, ArrayNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkAssignRoleDto {
  @ApiProperty({
    description: 'UUID of the user to assign roles to',
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
    description: 'Array of entity UUIDs to assign the role for',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  entityIds!: string[];

  @ApiPropertyOptional({
    description: 'Start date for all assignments',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

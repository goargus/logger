import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EntityType } from '../entity.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEntityDto {
  @ApiProperty({
    description: 'Name of the entity',
    example: 'Central Union',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Type of entity in the hierarchy',
    enum: EntityType,
    example: 'UNION',
  })
  @IsEnum(EntityType)
  type!: EntityType;

  @ApiPropertyOptional({
    description: 'UUID of the parent entity',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Unique code for the entity',
    example: 'CU-001',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Description of the entity',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Physical location of the entity',
    example: 'New York, NY',
  })
  @IsOptional()
  @IsString()
  location?: string;
}

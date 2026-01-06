import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean } from 'class-validator';
import { EntityType } from '../entity.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEntityDto {
  @ApiPropertyOptional({ description: 'Name of the entity' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Type of entity', enum: EntityType })
  @IsOptional()
  @IsEnum(EntityType)
  type?: EntityType;

  @ApiPropertyOptional({ description: 'UUID of the parent entity' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Unique code for the entity' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Description of the entity' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Physical location of the entity' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Whether the entity is active' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Currency symbol for displaying monetary values (typically set at Union level)',
    example: 'L',
  })
  @IsOptional()
  @IsString()
  currencySymbol?: string;
}

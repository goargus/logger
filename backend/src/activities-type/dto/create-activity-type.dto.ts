import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GrowthDirection } from '../activity-type.entity';

export class CreateActivityTypeDto {
  @ApiProperty({
    description: 'Name of the activity type',
    example: 'Bible Study',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Description of what this activity type represents',
    example: 'Regular Bible study sessions with community members',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Array of role UUIDs that can use this activity type',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  role_ids!: string[];

  @ApiPropertyOptional({
    description: 'Indicates whether growth in this activity type is positive, negative, or neutral',
    enum: GrowthDirection,
    default: GrowthDirection.POSITIVE,
  })
  @IsOptional()
  @IsEnum(GrowthDirection)
  growth_direction?: GrowthDirection;
}

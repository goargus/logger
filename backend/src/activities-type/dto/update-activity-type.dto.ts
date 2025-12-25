import { IsArray, IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateActivityTypeDto {
  @ApiPropertyOptional({ description: 'Name of the activity type' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the activity type' })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of role UUIDs that can use this activity type',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  role_ids?: string[];
}

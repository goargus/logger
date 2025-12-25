import { IsArray, ArrayNotEmpty, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}

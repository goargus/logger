import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAssignmentDto {
  @ApiProperty({
    description: 'New end date for the assignment',
    example: '2024-12-31',
  })
  @IsDateString()
  endDate!: string;
}

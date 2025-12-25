import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExceptionDto {
  @ApiProperty({
    description: 'UUID of the user to grant exception to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'Start date of the exception period',
    example: '2024-01-15',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date of the exception period',
    example: '2024-01-20',
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Reason for granting the exception',
    example: 'User was on medical leave',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Name of the role', maxLength: 80 })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the role', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

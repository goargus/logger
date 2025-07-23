import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateActivityDto {
  @IsUUID()
  @IsNotEmpty()
  category_id?: string;

  @IsDateString()
  @IsNotEmpty()
  date?: string;

  @IsOptional()
  description?: string;
}

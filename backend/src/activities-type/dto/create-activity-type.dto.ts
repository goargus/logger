import { IsArray, ArrayNotEmpty, IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateActivityTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  role_ids!: string[];
}

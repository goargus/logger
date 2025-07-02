import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUnionDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}

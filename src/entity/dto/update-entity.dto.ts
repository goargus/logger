import { EntityType } from '../../Entities';

export class UpdateEntityDto {
  name?: string;
  type?: EntityType;
  parent_id?: string | null;
  code?: string;
  location?: string;
  is_active?: boolean;
}
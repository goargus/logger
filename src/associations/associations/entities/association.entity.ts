import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Union } from '../../../unions/entities/union.entity';

@Entity()
export class Association {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Union, (union) => union.associations, {
    onDelete: 'CASCADE',
  })
  union!: Union;

  @Column()
  unionId!: string;
}

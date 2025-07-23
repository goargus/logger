import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.activities, { eager: false })
  user: User;

  @ManyToOne(() => Category, { eager: true })
  category: Category;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ default: false })
  is_locked!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

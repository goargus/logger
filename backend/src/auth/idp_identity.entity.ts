import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'idp_identity' })
@Index('uq_idp_identity_iss_sub', ['issuer', 'subject'], { unique: true })
@Index('idx_idp_identity_user_id', ['user_id'])
export class IdpIdentity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  user_id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'text' })
  provider!: string;

  @Column({ type: 'text' })
  issuer!: string;

  @Column({ type: 'text' })
  subject!: string;

  @Column({ type: 'text', nullable: true })
  audience!: string | null;

  @Column({ type: 'citext', nullable: true })
  email!: string | null;

  @Column({ type: 'boolean', nullable: true })
  email_verified!: boolean | null;

  @Column({ type: 'text', nullable: true })
  name!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  last_seen_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

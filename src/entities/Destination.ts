import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Account } from './Account';
import { Log } from './Log';

@Entity('destinations')
export class Destination {
  @PrimaryGeneratedColumn() id!: number;
  @Column() url!: string;
  @Column({ default: 'POST' }) method!: string;
  @Column({ type: 'json', nullable: true }) headers?: any;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) created_at!: Date;

  @Column() account_id!: string;
  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account?: Account;

@OneToMany(() => Log, (log) => log.destination)
public logs?: Log[]
  
}

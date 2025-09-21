import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Log } from './Log';

@Entity('accounts')
export class Account {
  @PrimaryColumn() account_id: string = uuidv4();
  @Column() account_name!: string;
  @Column() app_secret_token!: string;
  @Column({ nullable: true }) website?: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) created_at!: Date;

  @OneToMany(() => Log, (log) => log.account)
  public logs?: Log[]
}

import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
import { Account } from './Account';
import { User } from './User';
import { Destination } from './Destination';

@Entity('logs')
export class Log {
  @PrimaryColumn() event_id!: string;
  @Column({ nullable: true }) account_id?: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) received_timestamp!: Date;
  @Column({ type: 'timestamp', nullable: true }) processed_timestamp?: Date;
  @Column({ nullable: true }) destination_id?: number;
  @Column({ type: 'json', nullable: true }) received_data?: any;
  @Column({ nullable: true }) status?: string;


    @ManyToOne(() => Account, (account) => account.logs)
   public account?: Account;

      @ManyToOne(() => Destination, (destination) => destination.logs)
   public destination?: Destination;

}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AccountMember } from './AccountMember';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  role_name!: string;

  @OneToMany(() => AccountMember, (member) => member.role)
  members!: AccountMember[];
}

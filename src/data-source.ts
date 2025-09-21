import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Role } from './entities/Role';
import { Account } from './entities/Account';
import { Destination } from './entities/Destination';
import { AccountMember } from './entities/AccountMember';
import { Log } from './entities/Log';

const dataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: parseInt('3306'),
  username:  'root',
  password: 'Welcome123$',
  database: 'user_db',
  synchronize: false,
  logging: false,
  entities: [User, Role, Account, Destination, AccountMember, Log],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  cache: {
    type: 'redis',
    options: {
      host:  '127.0.0.1',
      port: parseInt( '6379')
    },
    duration: parseInt('60') * 1000
  }
});

export default dataSource;

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
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'example',
  database: process.env.DB_NAME || 'data_pusher',
  synchronize: false,
  logging: false,
  entities: [User, Role, Account, Destination, AccountMember, Log],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379')
    },
    duration: parseInt(process.env.CACHE_TTL_SECONDS || '60') * 1000
  }
});

export default dataSource;

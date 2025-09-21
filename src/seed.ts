import dataSource from './data-source';
import crypto from 'crypto';
import { Role } from './entities/Role';
import { User } from './entities/User';
import { Account } from './entities/Account';
import { AccountMember } from './entities/AccountMember';

async function seed(){
  await dataSource.initialize();
  await dataSource.runMigrations();
  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);
  const accRepo = dataSource.getRepository(Account);
  const amRepo = dataSource.getRepository(AccountMember);

  const admin = roleRepo.create({ role_name:'Admin' } as any);
  const normal = roleRepo.create({ role_name:'Normal user' } as any);
  await roleRepo.save([admin, normal]);

  const user = userRepo.create({ email:'admin@example.com', password:'password123' } as any);
  await userRepo.save(user);

  const account = accRepo.create({ account_name:'Default Account', app_secret_token: crypto.randomBytes(20).toString('hex') } as any);
  await accRepo.save(account);

  const am = amRepo.create({ account_id: account.account_id, user_id: user.id, role_id: admin.id } as any);
  await amRepo.save(am);

  console.log('Seed done. Admin user: admin@example.com / password123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });

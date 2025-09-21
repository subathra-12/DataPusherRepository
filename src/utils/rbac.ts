import dataSource from '../data-source';
import { AccountMember } from '../entities/AccountMember';
import { Role } from '../entities/Role';

/**
 * Check if a user has a specific role (by name) scoped to an account.
 */
export async function userHasRoleOnAccount(userId: number, accountId: string, roleName: string) {
  const amRepo = dataSource.getRepository(AccountMember);
  const roleRepo = dataSource.getRepository(Role);
  const memberships = await amRepo.find({ where: { user_id: userId, account_id: accountId } });
  if(!memberships || memberships.length === 0) return false;
  const roleIds = memberships.map(m => m.role_id);
  const roles = await roleRepo.createQueryBuilder('r').whereInIds(roleIds).getMany();
  const roleNames = roles.map(r => r.role_name);
  return roleNames.includes(roleName);
}

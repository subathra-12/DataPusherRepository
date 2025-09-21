import { Repository } from 'typeorm';
import dataSource from '../data-source';
import { Account } from '../entities/Account';

const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '60') * 1000;

export class AccountService {
  private repo: Repository<Account>;
  constructor() {
    this.repo = dataSource.getRepository(Account);
  }

  async findByToken(token: string) {
    const key = `account:token:${token}`;
    const acc = await this.repo.findOne({ where: { app_secret_token: token }, cache: { id: key, milliseconds: TTL } });
    return acc;
  }

  async clearCacheForToken(token: string){
    const key = `account:token:${token}`;
    await dataSource.queryResultCache?.remove([key]);
  }
}

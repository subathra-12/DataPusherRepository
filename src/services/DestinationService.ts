import { Repository } from 'typeorm';
import dataSource from '../data-source';
import { Destination } from '../entities/Destination';

const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '60') * 1000;

export class DestinationService {
  private repo: Repository<Destination>;
  constructor(){
    this.repo = dataSource.getRepository(Destination);
  }

  async findByAccount(account_id: string){
    const key = `destinations:account:${account_id}`;
    const dlist = await this.repo.createQueryBuilder('d').where('d.account_id = :aid', { aid: account_id }).cache(key, TTL).getMany();
    return dlist;
  }

  async clearAccountCache(account_id: string){
    const key = `destinations:account:${account_id}`;
    await dataSource.queryResultCache?.remove([key]);
  }
}

import Bull from 'bull';
import axios from 'axios';
import dataSource from './data-source';
import { Log } from './entities/Log';
import { Destination } from './entities/Destination';
import logger from './utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const q = new Bull('events', redisUrl, { prefix: process.env.BULL_PREFIX || 'bp' } as any);

export function initQueue(){
  q.process(async (job: any) => {
    const { event_id, account_id, data } = job.data;
    const destRepo = dataSource.getRepository(Destination);
    const logRepo = dataSource.getRepository(Log);

    const log = logRepo.create({ event_id, account_id, received_data: data, status: 'processing' } as any);
    await logRepo.save(log);

    const destinations = await destRepo.createQueryBuilder('d').where('d.account_id = :aid', { aid: account_id }).getMany();
    for(const dest of destinations){
      try{
        const headers = Object.assign({}, dest.headers || {}, { 'X-EVENT-ID': event_id });
        await axios({ url: dest.url, method: dest.method || 'POST', headers, data });
        const l = logRepo.create({ event_id, account_id, destination_id: dest.id, processed_timestamp: new Date(), status: 'success' } as any);
        await logRepo.save(l);
      }catch(err:any){
        logger.error('Forward error', err.message || err);
        const l = logRepo.create({ event_id, account_id, destination_id: dest.id, processed_timestamp: new Date(), status: 'failed' } as any);
        await logRepo.save(l);
      }
    }
  });
  q.on('failed', (job, err) => {
    logger.error('Job failed', job?.id, err);
  });
  logger.info('Queue initialized');
}

export async function enqueueEvent(payload: any){
  await q.add(payload, { attempts:3, backoff: { type:'exponential', delay: 500 } });
}

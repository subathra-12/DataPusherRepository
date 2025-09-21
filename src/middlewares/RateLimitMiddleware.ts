import { ExpressMiddlewareInterface } from 'routing-controllers';
import { AccountService } from '../services/AccountService';
import { slidingWindowLimit } from '../utils/redisRateLimiter';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000');
const MAX = parseInt(process.env.RATE_LIMIT_MAX || '5');
const accSvc = new AccountService();

export default class RateLimitMiddleware implements ExpressMiddlewareInterface {
  async use(req: any, res: any, next: (err?: any)=>any) {
    const token = req.headers['cl-x-token'];
    if(!token) return res.status(400).json({ success:false, message:'Missing CL-X-TOKEN' });
    const acc = await accSvc.findByToken(token);
    if(!acc) return res.status(404).json({ success:false, message:'Account not found' });
    const key = `account:${acc.account_id}`;
    try{
      const { allowed, remaining, reset } = await slidingWindowLimit(key, MAX, WINDOW_MS);
      res.setHeader('X-RateLimit-Limit', MAX.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(reset/1000).toString());
      if(!allowed) return res.status(400).json({ success:false, message:'Rate limit exceeded' });
      next();
    }catch(err){
      console.error('Rate limiter error', err);
      next();
    }
  }
}

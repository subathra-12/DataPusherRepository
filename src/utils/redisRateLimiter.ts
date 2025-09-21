import Redis from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1', port: parseInt(process.env.REDIS_PORT || '6379') });

/**
 * Sliding window rate limiter using Redis sorted sets.
 * key: string
 * limit: number (max requests)
 * windowMs: number (milliseconds)
 *
 * Returns { allowed: boolean, remaining: number, reset: number }
 */
export async function slidingWindowLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const member = `${now}-${Math.random().toString(36).slice(2,8)}`;

  const zkey = `ratelimit:${key}`;

  const tx = redis.multi();
  // add current event
  tx.zadd(zkey, now.toString(), member);
  // remove old events
  tx.zremrangebyscore(zkey, 0, windowStart.toString());
  // get count
  tx.zcard(zkey);
  // set expire slightly longer than window
  tx.pexpire(zkey, windowMs + 1000);
  const res = await tx.exec();
  // res is array of [err, result]
  const count = res && res[2] && res[2][1] ? parseInt(res[2][1]) : 0;
  const allowed = count <= limit;
  // remaining allowed (could be 0)
  const remaining = Math.max(0, limit - count);
  // next reset time = earliest timestamp + windowMs
  const earliest = await redis.zrange(zkey, 0, 0, 'WITHSCORES');
  let reset = now + windowMs;
  if(earliest && earliest.length === 2){
    const earliestTs = parseInt(earliest[1]);
    reset = earliestTs + windowMs;
  }
  return { allowed, remaining, reset };
}

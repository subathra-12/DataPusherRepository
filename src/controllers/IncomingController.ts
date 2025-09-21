import { JsonController, Post, Req, Res, UseBefore } from 'routing-controllers';
import { AccountService } from '../services/AccountService';
import { enqueueEvent } from '../queue';
import rateLimiter from '../middlewares/RateLimitMiddleware';

const accSvc = new AccountService();

@JsonController('/server')
export class IncomingController {
  @Post('/incoming_data')
  @UseBefore(rateLimiter)
  async incoming(@Req() req: any, @Res() res: any){
    const token = req.headers['cl-x-token'];
    const eventId = req.headers['cl-x-event-id'];
    if(!token || !eventId) return res.status(400).json({ success:false, message:'Missing headers' });
    const account = await accSvc.findByToken(token);
    if(!account) return res.status(404).json({ success:false, message:'Account not found' });
    if(!req.is('application/json')) return res.status(400).json({ success:false, message:'Only application/json allowed' });
    const data = req.body;
    await enqueueEvent({ event_id: eventId, account_id: account.account_id, data });
    return { success:true, message:'Data Received' };
  }
}

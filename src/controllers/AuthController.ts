import { JsonController, Post, Body, BadRequestError, Res, Req } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import jwt from 'jsonwebtoken';
import dataSource from '../data-source';
import { User } from '../entities/User';
import { Account } from '../entities/Account';
import { Role } from '../entities/Role';
import { AccountMember } from '../entities/AccountMember';
import crypto from 'crypto';

const secret = process.env.JWT_SECRET || 'change_me';

@JsonController('/auth')
export class AuthController {

  @OpenAPI({
    summary: 'Sign up a new user',
    description: 'Create a new user, account, and assign admin role',
    tags: ['Auth'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { email: { type: 'string' }, password: { type: 'string' } },
            required: ['email', 'password'],
            example: { email: 'user@example.com', password: 'password123' },
          },
        },
      },
    },
    responses: {
      200: { description: 'User signed up successfully', content: { 'application/json': { example: { success: true, token: 'jwt_token_here' } } } },
      400: { description: 'Email already exists or missing fields', content: { 'application/json': { example: { message: 'Email already exists. Try another one.' } } } },
    },
  })
  @Post('/signup')
  async signup(@Body() body: any, @Res() res: any) {
    const { email, password } = body;
    if (!email || !password) throw new BadRequestError('Missing fields');
    
    const userRepo = dataSource.getRepository(User);
    const exists = await userRepo.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Email already exists. Try another one.' });
    }

    const user = userRepo.create({ email, password } as any);
    await userRepo.save(user);

    const accountRepo = dataSource.getRepository(Account);
    const account = accountRepo.create({ account_name: `${email}'s account`, app_secret_token: crypto.randomBytes(20).toString('hex') } as any);
    await accountRepo.save(account);

    const roleRepo = dataSource.getRepository(Role);
    const adminRole = await roleRepo.findOne({ where: { role_name: 'Admin' } });
    if (adminRole) {
      const amRepo = dataSource.getRepository(AccountMember);
      const am = amRepo.create({ account_id: account.account_id, user_id: user.id, role_id: adminRole.id } as any);
      await amRepo.save(am);
    }

    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
    return { success: true, token };
  }

  @OpenAPI({
    summary: 'Login user',
    description: 'Authenticate user and return JWT token',
    tags: ['Auth'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { email: { type: 'string' }, password: { type: 'string' } },
            required: ['email', 'password'],
            example: { email: 'user@example.com', password: 'password123' },
          },
        },
      },
    },
    responses: {
      200: { description: 'User logged in successfully', content: { 'application/json': { example: { success: true, token: 'jwt_token_here' } } } },
      400: { description: 'Invalid credentials', content: { 'application/json': { example: { message: 'Invalid credentials' } } } },
    },
  })
  @Post('/login')
  async login(@Body() body: any) {
    const { email, password } = body;
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestError('Invalid credentials');

    const ok = await (user as any).checkPassword(password);
    if (!ok) throw new BadRequestError('Invalid credentials');

    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '7d' });
    return { success: true, token };
  }

  @OpenAPI({
    summary: 'Logout user',
    description: 'Logs out the currently authenticated user',
    tags: ['Auth'],
    responses: {
      200: { description: 'User logged out successfully', content: { 'application/json': { example: { success: true, message: 'Logged out successfully' } } } },
    },
  })
  @Post('/logout')
  async logout(@Res() res: any, @Req() req: any) {
    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.user.id } });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
}

import { JsonController, Get, Post, Param, Body, Authorized, CurrentUser, BadRequestError, Put, Delete } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import dataSource from '../data-source';
import { Account } from '../entities/Account';
import { Log } from '../entities/Log';
import crypto from 'crypto';
import { userHasRoleOnAccount } from '../utils/rbac';

@JsonController('/accounts')
export class AccountController {

  @OpenAPI({
    summary: 'Create a new account',
    description: 'Creates an account and logs the creation',
    tags: ['Accounts'],
    parameters: [
      { name: 'accountId', in: 'path', required: true, schema: { type: 'string' }, description: 'Unique account ID' }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { name: { type: 'string' }, website: { type: 'string' } },
            required: ['name'],
          },
        },
      },
    },
    responses: {
      200: { description: 'Account created successfully' },
      400: { description: 'Bad request' },
    },
  })
  @Post('/:accountId/destinations')
  @Authorized('Admin')
  async addAccount(@Param('accountId') accountId: string, @Body() body: any, @CurrentUser() user: any) {
    if (!user) throw new BadRequestError('Missing current user');
    const ok = await userHasRoleOnAccount(user.id, accountId, 'Admin');
    if (!ok) return { success: false, message: 'Forbidden: not an admin of this account' };

    const appSecretToken = crypto.randomBytes(32).toString('hex');

    const account = dataSource.getRepository(Account).create({
      account_id: accountId,
      account_name: body.name,
      app_secret_token: appSecretToken,
      website: body.website,
      created_by: user.id,
      created_at: new Date(),
    });

    const logData = new Log();
    logData.account_id = account.account_id;
    logData.received_data = account;
    logData.status = 'Account Created';
    await dataSource.getRepository(Log).save(logData);

    return { success: true, message: 'Account created successfully', data: account };
  }

  @OpenAPI({
    summary: 'Update an account',
    description: 'Update account name or website',
    tags: ['Accounts'],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Account ID to update' }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { accountName: { type: 'string' }, website: { type: 'string' } },
            example: { accountName: 'Updated Name', website: 'https://newsite.com' },
          },
        },
      },
    },
    responses: { 200: { description: 'Account updated successfully' }, 404: { description: 'Account not found' } },
  })
  @Put('/:id')
  @Authorized('Admin')
  async updateDestination(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    const accountData = await dataSource.getRepository(Account).findOne({ where: { account_id: id } });
    if (!accountData) return { success: false, message: 'Destination not found' };

    accountData.account_name = body.accountName ?? accountData.account_name;
    accountData.website = body.website ?? accountData.website;
    await dataSource.getRepository(Account).update(accountData.account_id, accountData);
    return { success: true, message: 'Account updated successfully', data: accountData };
  }

  @OpenAPI({
    summary: 'Get account details',
    description: 'Retrieve account by ID',
    tags: ['Accounts'],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Account retrieved successfully' }, 404: { description: 'Invalid Account Id' } },
  })
  @Get('/:id')
  @Authorized('Admin')
  async getDestination(@Param('id') id: string, @CurrentUser() user: any) {
    const accountData = await dataSource.getRepository(Account).findOne({ where: { account_id: id } });
    if (!accountData) return { success: false, message: 'Invalid Account Id' };
    return { success: true, message: 'Account retrieved successfully', data: accountData };
  }

  @OpenAPI({
    summary: 'Delete an account',
    description: 'Delete an account by ID',
    tags: ['Accounts'],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Account deleted successfully' }, 404: { description: 'Account not found' } },
  })
  @Delete('/:id')
  @Authorized('Admin')
  async deleteAccount(@Param('id') id: string) {
    const accountData = await dataSource.getRepository(Account).delete(id);
    return { success: true, message: 'Account deleted successfully', data: accountData };
  }
}

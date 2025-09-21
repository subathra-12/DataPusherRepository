import { JsonController, Get, Post, Param, Body, Authorized, CurrentUser, BadRequestError, Put, Delete, QueryParam } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import dataSource from '../data-source';
import { AccountMember } from '../entities/AccountMember';
import { userHasRoleOnAccount } from '../utils/rbac';
import { Log } from '../entities/Log';
import { Account } from '../entities/Account';

@JsonController('/account-members')
export class AccountMemberController {

  @OpenAPI({
    summary: 'Add a member to an account',
    description: 'Adds a new member to an account if the current user is an admin',
    tags: ['Account Members'],
    parameters: [
      { name: 'accountId', in: 'path', required: true, schema: { type: 'string' }, description: 'Account ID' }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { user_id: { type: 'string' }, role_id: { type: 'string' } },
            required: ['user_id', 'role_id'],
            example: { user_id: 'user123', role_id: 'role_admin' },
          },
        },
      },
    },
    responses: {
      200: { description: 'Member created successfully' },
      400: { description: 'Missing current user' },
      403: { description: 'Forbidden: not an admin' },
    },
  })
  @Post('/:accountId/members')
  @Authorized('Admin')
  async addMember(@Param('accountId') accountId: string, @Body() body: any, @CurrentUser() user: any) {
    const account = await dataSource.getRepository(Account).findOne({ where: { account_id: accountId } });
    if (!account) return { success: false, message: 'Account not found' };
    if (!user) throw new BadRequestError('Missing current user');
    const ok = await userHasRoleOnAccount(user.id, accountId, 'Admin');
    if (!ok) return { success: false, message: 'Forbidden: not an admin of this account' };

    const member = dataSource.getRepository(AccountMember).create({
      account_id: account.account_id,
      user_id: body.user_id,
      role_id: body.role_id,
      created_by: user.id,
      created_at: new Date(),
    });
    const saveMember = await dataSource.getRepository(AccountMember).save(member);
    return { success: true, message: 'Member created successfully', data: saveMember };
  }

  @OpenAPI({
    summary: 'Update a member',
    description: 'Update user ID or role ID of an account member',
    tags: ['Account Members'],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'number' }, description: 'Member ID to update' }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { userId: { type: 'string' }, roleId: { type: 'string' } },
            example: { userId: 'user123', roleId: 'role_editor' },
          },
        },
      },
    },
    responses: {
      200: { description: 'Member updated successfully' },
      404: { description: 'Member not found' },
    },
  })
  @Put('/:id')
  @Authorized('Admin')
  async updateMember(@Param('id') id: number, @Body() body: any, @CurrentUser() user: any) {
    const memberData = await dataSource.getRepository(AccountMember).findOne({ where: { id } });
    if (!memberData) return { success: false, message: 'Member not found' };

    memberData.user_id = body.userId ?? memberData.user_id;
    memberData.role_id = body.roleId ?? memberData.role_id;
    memberData.updated_by = user.id;

    const updateMember = await dataSource.getRepository(AccountMember).save(memberData);
    return { success: true, message: 'Member updated successfully', data: updateMember };
  }

  @OpenAPI({
    summary: 'Get all members',
    description: 'Retrieve all account members',
    tags: ['Account Members'],
    responses: {
      200: { description: 'Members retrieved successfully' },
    },
  })
  @Get()
  @Authorized('Admin')
  async getAllMembers(@CurrentUser() user: any) {
    const members = await dataSource.getRepository(AccountMember).find();
    return { success: true, message: 'Members retrieved successfully', data: members };
  }

  @OpenAPI({
    summary: 'Get a member by ID',
    description: 'Retrieve a specific account member by ID',
    tags: ['Account Members'],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'number' }, description: 'Member ID' }
    ],
    responses: {
      200: { description: 'Member retrieved successfully' },
      404: { description: 'Invalid Member Id' },
    },
  })
  @Get('/:id')
  @Authorized('Admin')
  async getMember(@Param('id') id: number, @CurrentUser() user: any) {
    const memberData = await dataSource.getRepository(AccountMember).findOne({ where: { id } });
    if (!memberData) return { success: false, message: 'Invalid Member Id' };
    return { success: true, message: 'Member retrieved successfully', data: memberData };
  }

  @OpenAPI({
    summary: 'Delete a member',
    description: 'Delete a member by ID',
    tags: ['Account Members'],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'number' }, description: 'Member ID to delete' }
    ],
    responses: {
      200: { description: 'Member deleted successfully' },
      404: { description: 'Member not found' },
    },
  })
  @Delete('/:id')
  @Authorized('Admin')
  async deleteMember(@Param('id') id: number) {
    const memberData = await dataSource.getRepository(AccountMember).delete(id);
    return { success: true, message: 'Member deleted successfully', data: memberData };
  }

  @OpenAPI({
    summary: 'Read logs',
    description: 'Retrieve logs for account and/or destination filtered by status and date range',
    tags: ['Account Members'],
    parameters: [
      { name: 'accountId', in: 'query', schema: { type: 'string' }, description: 'Filter logs by account ID' },
      { name: 'destinationId', in: 'query', schema: { type: 'string' }, description: 'Filter logs by destination ID' },
      { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter logs by status' },
      { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter logs from this date/time' },
      { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter logs up to this date/time' },
    ],
    responses: {
      200: { description: 'Logs retrieved successfully' },
    },
  })
  @Get('/read-logs')
  @Authorized('Admin')
  async readLogs(
    @CurrentUser() user: any,
    @QueryParam("accountId") accountId?: string,
    @QueryParam("destinationId") destinationId?: string,
    @QueryParam("status") status?: string,
    @QueryParam("from") from?: string,
    @QueryParam("to") to?: string
  ) {
    const repo = dataSource.getRepository(Log);
    let query = repo
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.account", "account")
      .leftJoinAndSelect("log.destination", "destination");

    if (accountId) query = query.andWhere("account.account_id = :accountId", { accountId });
    if (destinationId) query = query.andWhere("destination.id = :destinationId", { destinationId });
    if (status) query = query.andWhere("log.status = :status", { status });
    if (from) query = query.andWhere("log.received_timestamp >= :from", { from });
    if (to) query = query.andWhere("log.received_timestamp <= :to", { to });

    const logs = await query.orderBy("log.received_timestamp", "DESC").getMany();

    return { success: true, message: "Logs retrieved successfully", data: logs };
  }
}

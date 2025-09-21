import { JsonController, Get, Post, Param, Body, Authorized, CurrentUser, BadRequestError, Put, Delete } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import dataSource from '../data-source';
import { Destination } from '../entities/Destination';
import { Log } from '../entities/Log';
import { Account } from '../entities/Account';
import { userHasRoleOnAccount } from '../utils/rbac';

@JsonController('/destinations')
export class DestinationController {

  @OpenAPI({
    summary: 'Create a destination',
    description: 'Adds a new destination for an account and logs the creation',
    tags: ['Destinations'],
    parameters: [
      { name: 'accountId', in: 'path', required: true, schema: { type: 'string' }, description: 'Account ID to create destination for' }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { url: { type: 'string' }, method: { type: 'string' }, headers: { type: 'object' } },
            required: ['url'],
            example: { url: 'https://example.com/webhook', method: 'POST', headers: { Authorization: 'Bearer token' } },
          },
        },
      },
    },
    responses: {
      200: { description: 'Destination created successfully', content: { 'application/json': { example: { success: true, message: 'Destination created successfully', data: {} } } } },
      400: { description: 'Missing current user or account not found' },
      403: { description: 'Forbidden: user not admin' },
    },
  })
  @Post('/:accountId/destinations')
  @Authorized('Admin')
  async addDest(@Param('accountId') accountId: string, @Body() body: any, @CurrentUser() user: any) {
    const account = await dataSource.getRepository(Account).findOne({ where: { account_id: accountId } });
    if (!account) return { success: false, message: 'Account not found' };
    if (!user) throw new BadRequestError('Missing current user');
    const ok = await userHasRoleOnAccount(user.id, accountId, 'Admin');
    if (!ok) return { success: false, message: 'Forbidden: not an admin of this account' };

    const dest = dataSource.getRepository(Destination).create({
      account_id: account.account_id,
      url: body.url,
      method: body.method || 'POST',
      headers: body.headers
    });
    const saveDest = await dataSource.getRepository(Destination).save(dest);

    // Adding log
    const logData = new Log();
    logData.destination_id = saveDest.id;
    logData.received_data = saveDest;
    logData.account_id = accountId;
    logData.processed_timestamp = new Date();
    logData.status = 'Destination Created';
    await dataSource.getRepository(Log).save(logData);

    return { success: true, message: 'Destination created successfully', data: dest };
  }

  @OpenAPI({
    summary: 'Update a destination',
    description: 'Update URL, method, or headers of a destination and logs the update',
    tags: ['Destinations'],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' }, description: 'Destination ID' }],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { url: { type: 'string' }, method: { type: 'string' }, headers: { type: 'object' } },
            example: { url: 'https://example.com/new-webhook', method: 'PUT', headers: { Authorization: 'Bearer newtoken' } },
          },
        },
      },
    },
    responses: {
      200: { description: 'Destination updated successfully' },
      404: { description: 'Destination not found' },
    },
  })
  @Put('/:id')
  @Authorized('Admin')
  async updateDestination(@Param('id') id: number, @Body() body: any, @CurrentUser() user: any) {
    const destinationData: any = await dataSource.getRepository(Destination).findOne({ where: { id } });
    if (!destinationData) return { success: false, message: 'Destination not found' };

    destinationData.url = body.url ?? destinationData.url;
    destinationData.method = body.method ?? destinationData.method;
    destinationData.headers = body.headers ?? destinationData.headers;

    const updateDestination = await dataSource.getRepository(Destination).save(destinationData);

    // Log
    const logData = new Log();
    logData.destination_id = destinationData.id;
    logData.received_data = updateDestination;
    logData.account_id = destinationData.accountId;
    logData.processed_timestamp = new Date();
    logData.status = 'Destination updated';
    await dataSource.getRepository(Log).save(logData);

    return { success: true, message: 'Destination updated successfully', data: destinationData };
  }

  @OpenAPI({
    summary: 'Get all destinations',
    description: 'Retrieve all destinations',
    tags: ['Destinations'],
    responses: { 200: { description: 'Destinations retrieved successfully' } },
  })
  @Get()
  @Authorized('Admin')
  async getAllDestinations(@CurrentUser() user: any) {
    const destinations = await dataSource.getRepository(Destination).find();
    return { success: true, message: 'Destinations retrieved successfully', data: destinations };
  }

  @OpenAPI({
    summary: 'Get a destination by ID',
    description: 'Retrieve a specific destination by its ID',
    tags: ['Destinations'],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' }, description: 'Destination ID' }],
    responses: {
      200: { description: 'Destination retrieved successfully' },
      404: { description: 'Invalid Destination Id' },
    },
  })
  @Get('/:id')
  @Authorized('Admin')
  async getDestination(@Param('id') id: number, @Body() body: any, @CurrentUser() user: any) {
    const destinationData = await dataSource.getRepository(Destination).findOne({ where: { id } });
    if (!destinationData) return { success: false, message: 'Invalid Destination Id' };
    return { success: true, message: 'Destination retrieved successfully', data: destinationData };
  }


   @Get('/destination-account/:accountId')
   @Authorized('Admin')
  async getAccountDestination(@Param('accountId') accountId: string, @Body() body: any, @CurrentUser() user: any) {
    const destinationData = await dataSource.getRepository(Destination).find({ where: { account_id:  accountId } });
    if (!destinationData) return { success: false, message: 'Invalid Account Id' };
    return { success: true, message: 'Destination retrieved successfully', data: destinationData };
  }

  @OpenAPI({
    summary: 'Delete a destination',
    description: 'Delete a destination by its ID',
    tags: ['Destinations'],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' }, description: 'Destination ID' }],
    responses: {
      200: { description: 'Destination deleted successfully' },
      404: { description: 'Destination not found' },
    },
  })
  @Delete('/:id')
  @Authorized('Admin')
  async deleteDestination(@Param('id') id: number) {
    const destinationData = await dataSource.getRepository(Destination).delete(id);
    return { success: true, message: 'Destination deleted successfully', data: destinationData };
  }
}

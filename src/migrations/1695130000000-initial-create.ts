import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class initialCreate1695130000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: 'roles',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'role_name', type: 'varchar', isUnique: true },
                { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: 'users',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'email', type: 'varchar', isUnique: true },
                { name: 'password', type: 'varchar' },
                { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: 'accounts',
            columns: [
                { name: 'account_id', type: 'varchar', isPrimary:true },
                { name: 'account_name', type: 'varchar' },
                { name: 'app_secret_token', type: 'varchar' },
                { name: 'website', type: 'varchar', isNullable:true },
                { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: 'account_members',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'account_id', type: 'varchar' },
                { name: 'user_id', type: 'int' },
                { name: 'role_id', type: 'int' },
                { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: 'destinations',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'url', type: 'varchar' },
                { name: 'method', type: 'varchar', default: "'POST'" },
                { name: 'headers', type: 'json', isNullable:true },
                { name: 'account_id', type: 'varchar' },
                { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
            ]
        }), true);

        await queryRunner.createTable(new Table({
            name: 'logs',
            columns: [
                { name: 'event_id', type: 'varchar', isPrimary:true },
                { name: 'account_id', type: 'varchar', isNullable:true },
                { name: 'received_timestamp', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
                { name: 'processed_timestamp', type: 'timestamp', isNullable:true },
                { name: 'destination_id', type: 'int', isNullable:true },
                { name: 'received_data', type: 'json', isNullable:true },
                { name: 'status', type: 'varchar', isNullable:true }
            ]
        }), true);

        // add foreign keys
        await queryRunner.createForeignKey('account_members', new TableForeignKey({
          columnNames: ['account_id'],
          referencedTableName: 'accounts',
          referencedColumnNames: ['account_id'],
          onDelete: 'CASCADE'
        }));
        await queryRunner.createForeignKey('account_members', new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE'
        }));
        await queryRunner.createForeignKey('account_members', new TableForeignKey({
          columnNames: ['role_id'],
          referencedTableName: 'roles',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL'
        }));

        await queryRunner.createForeignKey('destinations', new TableForeignKey({
          columnNames: ['account_id'],
          referencedTableName: 'accounts',
          referencedColumnNames: ['account_id'],
          onDelete: 'CASCADE'
        }));

        await queryRunner.createForeignKey('logs', new TableForeignKey({
          columnNames: ['account_id'],
          referencedTableName: 'accounts',
          referencedColumnNames: ['account_id'],
          onDelete: 'SET NULL'
        }));

        await queryRunner.createForeignKey('logs', new TableForeignKey({
          columnNames: ['destination_id'],
          referencedTableName: 'destinations',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL'
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('logs');
        await queryRunner.dropTable('destinations');
        await queryRunner.dropTable('account_members');
        await queryRunner.dropTable('accounts');
        await queryRunner.dropTable('users');
        await queryRunner.dropTable('roles');
    }
}

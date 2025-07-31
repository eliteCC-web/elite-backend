import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVideosToStores1700000000000 implements MigrationInterface {
    name = 'AddVideosToStores1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" ADD "videos" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "videos"`);
    }
} 
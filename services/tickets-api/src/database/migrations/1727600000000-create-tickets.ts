import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTickets1727600000000 implements MigrationInterface {
  name = 'CreateTickets1727600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tickets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "subject" varchar(200) NOT NULL,
        "body" text NOT NULL,
        "customer_email" varchar(254) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending_triage',
        "category" varchar(20),
        "priority" varchar(10),
        "suggested_reply" text,
        "triage_provider" varchar(20),
        "triaged_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_tickets_created_at" ON "tickets" ("created_at" DESC)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tickets"`);
  }
}

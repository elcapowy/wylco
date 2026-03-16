import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1773404692750 implements MigrationInterface {
    name = 'InitialSchema1773404692750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'DISPATCHER', "portOverride" boolean NOT NULL DEFAULT false, "logsAccess" boolean NOT NULL DEFAULT false, "financialView" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inventory" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "lowStockThreshold" integer NOT NULL DEFAULT '0', "warehouse" character varying NOT NULL DEFAULT 'SOUTH', "productId" integer, CONSTRAINT "PK_82aa5da437c5bbfb80703b08309" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product" ("id" SERIAL NOT NULL, "sku" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "basePrice" double precision NOT NULL DEFAULT '0', "purchasePrice" double precision NOT NULL DEFAULT '0', "replacementPrice" double precision NOT NULL DEFAULT '0', "salePriceMin" double precision NOT NULL DEFAULT '0', "salePriceMax" double precision NOT NULL DEFAULT '0', "isPromotion" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_34f6ca1cd897cc926bdcca1ca39" UNIQUE ("sku"), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shipment_item" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "shipmentId" integer, "productId" integer, CONSTRAINT "PK_f6228898b4578ba672a2f794d11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shipment" ("id" SERIAL NOT NULL, "containerNumber" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'IN_TRANSIT', "eta" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c7a417b71e9aa75329362cd81a6" UNIQUE ("containerNumber"), CONSTRAINT "PK_f51f635db95c534ca206bf7a0a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_item" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "unitPrice" double precision NOT NULL DEFAULT '0', "markup" double precision NOT NULL DEFAULT '0', "landedPrice" double precision NOT NULL DEFAULT '0', "orderId" integer, "productId" integer, CONSTRAINT "PK_d01158fe15b1ead5c26fd7f4e90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order" ("id" SERIAL NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "subtotal" double precision NOT NULL DEFAULT '0', "markupTotal" double precision NOT NULL DEFAULT '0', "taxAmount" double precision NOT NULL DEFAULT '0', "freightCost" double precision NOT NULL DEFAULT '0', "totalAmount" double precision NOT NULL DEFAULT '0', "clientName" character varying, "clientAddress" character varying, "clientAttention" character varying, "paymentTerms" character varying, "transportType" character varying, "shippingAddress" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" SERIAL NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "userEmail" character varying NOT NULL, "action" character varying NOT NULL, "details" character varying NOT NULL, "entityId" character varying, CONSTRAINT "PK_07fefa57f7f5ab8fc3f52b3ed0b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD CONSTRAINT "FK_c8622e1e24c6d054d36e8824490" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipment_item" ADD CONSTRAINT "FK_e4b0906b4cfeb96bd72b6d1dfab" FOREIGN KEY ("shipmentId") REFERENCES "shipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipment_item" ADD CONSTRAINT "FK_350ce4e66d33f00dd07fe351c50" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_item" ADD CONSTRAINT "FK_904370c093ceea4369659a3c810" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_caabe91507b3379c7ba73637b84" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_caabe91507b3379c7ba73637b84"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_904370c093ceea4369659a3c810"`);
        await queryRunner.query(`ALTER TABLE "order_item" DROP CONSTRAINT "FK_646bf9ece6f45dbe41c203e06e0"`);
        await queryRunner.query(`ALTER TABLE "shipment_item" DROP CONSTRAINT "FK_350ce4e66d33f00dd07fe351c50"`);
        await queryRunner.query(`ALTER TABLE "shipment_item" DROP CONSTRAINT "FK_e4b0906b4cfeb96bd72b6d1dfab"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP CONSTRAINT "FK_c8622e1e24c6d054d36e8824490"`);
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TABLE "order_item"`);
        await queryRunner.query(`DROP TABLE "shipment"`);
        await queryRunner.query(`DROP TABLE "shipment_item"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      // Allow API boot for health/smoke when Postgres is not up yet
      this.logger.warn(`Prisma connect deferred: ${String(err)}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

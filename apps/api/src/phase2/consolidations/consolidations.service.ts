import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { newId } from '../../common/crypto/token.util';
import { requireTenantId } from '../../common/utils/require-tenant';
import type { AuthContext } from '../../common/types/auth-context';
import type { CreateConsolidationDto } from '../dto/phase2.dto';

@Injectable()
export class ConsolidationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(auth: AuthContext, dto: CreateConsolidationDto) {
    const tenantId = requireTenantId(auth);
    const master = await this.prisma.shipment.findFirst({
      where: { id: dto.masterShipmentId, tenantId },
    });
    if (!master) throw new NotFoundException('Master shipment not found');

    const uniqueHouses = [...new Set(dto.houseShipmentIds.filter((id) => id !== dto.masterShipmentId))];
    if (!uniqueHouses.length) {
      throw new BadRequestException('At least one house shipment is required');
    }

    const houses = await this.prisma.shipment.findMany({
      where: { id: { in: uniqueHouses }, tenantId },
    });
    if (houses.length !== uniqueHouses.length) {
      throw new ForbiddenException({
        code: 'CROSS_TENANT_SHIPMENT',
        message: 'House shipments must belong to the same tenant',
      });
    }

    const consolidation = await this.prisma.shipmentConsolidation.create({
      data: {
        id: newId(),
        tenantId,
        masterShipmentId: master.id,
        houses: {
          create: uniqueHouses.map((houseShipmentId) => ({
            id: newId(),
            tenantId,
            houseShipmentId,
          })),
        },
      },
      include: { houses: true },
    });

    return {
      data: {
        id: consolidation.id,
        masterShipmentId: consolidation.masterShipmentId,
        houseShipmentIds: consolidation.houses.map((h) => h.houseShipmentId),
      },
    };
  }

  async list(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const rows = await this.prisma.shipmentConsolidation.findMany({
      where: { tenantId },
      include: { houses: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        masterShipmentId: row.masterShipmentId,
        houseShipmentIds: row.houses.map((h) => h.houseShipmentId),
      })),
    };
  }
}

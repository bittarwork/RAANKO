import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { newId } from '../common/crypto/token.util';
import { requireTenantId } from '../common/utils/require-tenant';
import { extractTenantSlugFromHost } from '../common/guards/auth.guards';
import type { AuthContext } from '../common/types/auth-context';
import {
  canTransitionShipment,
  type ShipmentStatusValue,
} from './shipment-status';
import type {
  CreateBookingDto,
  CreateShipmentDto,
  CreateTrackingEventDto,
} from './dto/operations.dto';

const PUBLIC_TRACKING_FIELDS = [
  'trackingNumber',
  'status',
  'origin',
  'destination',
  'mode',
  'events',
] as const;

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBookings(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.booking.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async createBooking(auth: AuthContext, dto: CreateBookingDto) {
    const tenantId = requireTenantId(auth);
    const quote = await this.prisma.quote.findFirst({
      where: { id: dto.quoteId, tenantId },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== 'accepted') {
      throw new BadRequestException('Quote must be accepted before booking');
    }

    const trackingNumber = this.newTrackingNumber();
    const result = await this.prisma.$transaction(async (tx) => {
      const shipment =
        dto.createShipment === false
          ? null
          : await tx.shipment.create({
              data: {
                id: newId(),
                tenantId,
                quoteId: quote.id,
                customerId: quote.customerId,
                trackingNumber,
                status: 'booked',
                origin: undefined,
                destination: undefined,
              },
            });

      const booking = await tx.booking.create({
        data: {
          id: newId(),
          tenantId,
          quoteId: quote.id,
          customerId: quote.customerId,
          shipmentId: shipment?.id,
          status: 'confirmed',
          notes: dto.notes,
        },
      });

      if (shipment) {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: { bookingId: booking.id },
        });
      }

      return { booking, shipment };
    });

    return { data: result };
  }

  async listShipments(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const data = await this.prisma.shipment.findMany({
      where: { tenantId },
      include: {
        cargoItems: true,
        parties: true,
        containers: true,
        events: { orderBy: { occurredAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async getShipment(auth: AuthContext, id: string) {
    const tenantId = requireTenantId(auth);
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId },
      include: {
        cargoItems: true,
        parties: true,
        containers: true,
        events: { orderBy: { occurredAt: 'asc' } },
      },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return { data: shipment };
  }

  async createShipment(auth: AuthContext, dto: CreateShipmentDto) {
    const tenantId = requireTenantId(auth);
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: dto.customerId, tenantId, deletedAt: null },
      });
      if (!customer) throw new NotFoundException('Customer not found');
    }
    if (dto.quoteId) {
      const quote = await this.prisma.quote.findFirst({
        where: { id: dto.quoteId, tenantId },
      });
      if (!quote) throw new NotFoundException('Quote not found');
    }

    const shipment = await this.prisma.shipment.create({
      data: {
        id: newId(),
        tenantId,
        quoteId: dto.quoteId,
        customerId: dto.customerId,
        trackingNumber: this.newTrackingNumber(),
        status: 'draft',
        origin: dto.origin,
        destination: dto.destination,
        mode: dto.mode,
        notes: dto.notes,
        cargoItems: {
          create: (dto.cargoItems ?? []).map((item) => ({
            id: newId(),
            tenantId,
            description: item.description,
            quantity: item.quantity ?? 1,
            weightKg: item.weightKg,
            volumeCbm: item.volumeCbm,
          })),
        },
        parties: {
          create: (dto.parties ?? []).map((party) => ({
            id: newId(),
            tenantId,
            role: party.role,
            name: party.name,
            email: party.email,
            phone: party.phone,
            address: party.address,
          })),
        },
        containers: {
          create: (dto.containers ?? []).map((c) => ({
            id: newId(),
            tenantId,
            containerNo: c.containerNo,
            containerType: c.containerType,
            sealNo: c.sealNo,
          })),
        },
      },
      include: {
        cargoItems: true,
        parties: true,
        containers: true,
        events: true,
      },
    });
    return { data: shipment };
  }

  async changeStatus(auth: AuthContext, id: string, next: string) {
    const tenantId = requireTenantId(auth);
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, tenantId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (!canTransitionShipment(shipment.status, next)) {
      throw new BadRequestException(
        `Invalid status transition from ${shipment.status} to ${next}`,
      );
    }
    const updated = await this.prisma.shipment.update({
      where: { id },
      data: { status: next as ShipmentStatusValue },
    });
    return { data: updated };
  }

  async addTrackingEvent(
    auth: AuthContext,
    shipmentId: string,
    dto: CreateTrackingEventDto,
  ) {
    const tenantId = requireTenantId(auth);
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, tenantId },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    const event = await this.prisma.trackingEvent.create({
      data: {
        id: newId(),
        tenantId,
        shipmentId,
        status: dto.status,
        message: dto.message,
        isPublic: dto.isPublic ?? false,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
    });
    return { data: event };
  }

  async publicTrack(
    trackingNumber: string,
    tenantSlug: string | undefined,
    host: string | undefined,
  ) {
    const hostname = host?.split(':')[0]?.toLowerCase();
    let tenant = null;
    if (hostname) {
      const custom = await this.prisma.tenantCustomDomain.findFirst({
        where: {
          hostname,
          status: 'verified',
          verifiedAt: { not: null },
        },
      });
      if (custom) {
        tenant = await this.prisma.tenant.findUnique({ where: { id: custom.tenantId } });
      }
    }
    if (!tenant) {
      const slug = tenantSlug?.trim() || extractTenantSlugFromHost(host);
      if (!slug) {
        throw new BadRequestException('tenantSlug is required');
      }
      tenant = await this.prisma.tenant.findUnique({
        where: { slug },
      });
    }
    if (!tenant) {
      throw new NotFoundException('Tracking not found');
    }

    const shipment = await this.prisma.shipment.findFirst({
      where: {
        tenantId: tenant.id,
        trackingNumber,
      },
      include: {
        events: {
          where: { isPublic: true },
          orderBy: { occurredAt: 'asc' },
        },
      },
    });
    if (!shipment) {
      throw new NotFoundException('Tracking not found');
    }

    return {
      data: this.toPublicTracking(shipment),
    };
  }

  toPublicTracking(shipment: {
    trackingNumber: string;
    status: string;
    origin: string | null;
    destination: string | null;
    mode: string | null;
    events: Array<{
      occurredAt: Date;
      status: string;
      message: string | null;
      isPublic?: boolean;
    }>;
    [key: string]: unknown;
  }) {
    return {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      mode: shipment.mode,
      events: shipment.events.map((event) => ({
        occurredAt: event.occurredAt,
        status: event.status,
        message: event.message,
      })),
    };
  }

  publicFieldAllowlist() {
    return PUBLIC_TRACKING_FIELDS;
  }

  private newTrackingNumber() {
    return `RK${newId().slice(-12).toUpperCase()}`;
  }
}

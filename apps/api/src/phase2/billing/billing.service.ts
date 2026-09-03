import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { requireTenantId } from '../../common/utils/require-tenant';
import type { AuthContext } from '../../common/types/auth-context';
import type { PatchPlanDto } from '../dto/phase2.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { code: 'asc' },
      include: { features: { include: { feature: true } } },
    });
    return {
      data: plans.map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        isActive: plan.isActive,
        // Public commercial prices remain unset until OQ-005
        price: null,
        currency: 'EUR',
        features: plan.features.map((pf) => ({
          key: pf.feature.key,
          enabled: pf.enabled,
        })),
      })),
    };
  }

  async patchPlan(id: string, dto: PatchPlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    const updated = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    return {
      data: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        description: updated.description,
        isActive: updated.isActive,
        price: null,
        currency: 'EUR',
      },
    };
  }

  async companySubscription(auth: AuthContext) {
    const tenantId = requireTenantId(auth);
    const sub = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return {
      data: {
        status: sub.status,
        planCode: sub.plan.code,
        planName: sub.plan.name,
        trialEndsAt: sub.trialEndsAt,
        currentPeriodEnd: sub.currentPeriodEnd,
        price: null,
        currency: 'EUR',
      },
    };
  }
}

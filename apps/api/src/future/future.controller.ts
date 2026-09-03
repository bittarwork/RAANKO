import {
  Controller,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FeatureKeys } from '@raanko/shared';
import { CompanyAuthGuard } from '../common/guards/auth.guards';
import { CurrentAuth } from '../common/decorators/auth.decorators';
import type { AuthContext } from '../common/types/auth-context';

@Controller('future')
@UseGuards(CompanyAuthGuard)
export class FutureController {
  @Get('warehouse')
  warehouse(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.WAREHOUSE, 'warehouse');
  }

  @Get('inventory')
  inventory(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.INVENTORY, 'inventory');
  }

  @Get('fleet')
  fleet(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.FLEET, 'fleet');
  }

  @Get('gps')
  gps(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.GPS_TRACKING, 'gps');
  }

  @Get('driver-app')
  driverApp(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.DRIVER_APP, 'driver-app');
  }

  @Get('customer-app')
  customerApp(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.CUSTOMER_APP, 'customer-app');
  }

  @Get('ops-app')
  opsApp(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.OPS_APP, 'ops-app');
  }

  @Get('integrations/carriers')
  carriers(@CurrentAuth() auth: AuthContext) {
    return this.gatedAny(
      auth,
      [FeatureKeys.CARRIER_API, FeatureKeys.AIRLINE_API],
      'integrations/carriers',
    );
  }

  @Get('integrations/accounting')
  accounting(@CurrentAuth() auth: AuthContext) {
    return this.gatedAny(
      auth,
      [FeatureKeys.QUICKBOOKS, FeatureKeys.XERO],
      'integrations/accounting',
    );
  }

  @Get('integrations/messaging')
  messaging(@CurrentAuth() auth: AuthContext) {
    return this.gatedAny(
      auth,
      [FeatureKeys.WHATSAPP, FeatureKeys.SMS],
      'integrations/messaging',
    );
  }

  @Get('ai/documents')
  aiDocuments(@CurrentAuth() auth: AuthContext) {
    return this.gated(auth, FeatureKeys.AI_DOCUMENTS, 'ai/documents');
  }

  gated(auth: AuthContext, featureKey: string, moduleName: string) {
    if (!auth.tenant?.entitlements.has(featureKey)) {
      throw new ForbiddenException({
        code: 'FEATURE_NOT_ENTITLED',
        message: 'Feature is not entitled for this tenant',
      });
    }
    throw new HttpException(
      {
        code: 'FUTURE_MODULE_NOT_IMPLEMENTED',
        module: moduleName,
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  private gatedAny(auth: AuthContext, keys: string[], moduleName: string) {
    const entitled = keys.some((key) => auth.tenant?.entitlements.has(key));
    if (!entitled) {
      throw new ForbiddenException({
        code: 'FEATURE_NOT_ENTITLED',
        message: 'Feature is not entitled for this tenant',
      });
    }
    throw new HttpException(
      {
        code: 'FUTURE_MODULE_NOT_IMPLEMENTED',
        module: moduleName,
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}

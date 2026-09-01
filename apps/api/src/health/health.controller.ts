import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      data: {
        status: 'ok',
        service: 'raanko-api',
        timestamp: new Date().toISOString(),
      },
      meta: {
        version: '0.1.0',
      },
    };
  }
}

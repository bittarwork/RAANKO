import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix matches /api/v1 contract
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT', 3001);
  const host = config.get<string>('API_HOST', '0.0.0.0');

  await app.listen(port, host);
}

bootstrap();

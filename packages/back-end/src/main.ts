import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for frontend development
  app.enableCors({
    origin: [
      'http://niewang.uunat.com:16974',
      'http://192.168.1.118:3001',
      'http://localhost:3001',
      process.env.FRONT_END_URL || 'http://niewang.uunat.com:16974',
      process.env.FRONT_END_URL_DEV || 'http://192.168.1.118:3001',
    ].filter(Boolean), // Remove any undefined/null values
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
  });

  // 配置静态文件服务，将 uploads 目录暴露为 /uploads 路径
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

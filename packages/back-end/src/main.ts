import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for frontend development
  app.enableCors({
    origin: (origin, callback) => {
      // 允许列表
      const allowedOrigins = [
        process.env.FRONT_END_URL,
        process.env.FRONT_END_URL_DEV,
        'http://localhost:5173',
      ].filter(Boolean); // 过滤掉环境变量未定义的情况

      // 如果没有 origin (如 postman/curl) 或者在白名单内，则放行
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 配置静态文件服务，将 uploads 目录暴露为 /uploads 路径
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

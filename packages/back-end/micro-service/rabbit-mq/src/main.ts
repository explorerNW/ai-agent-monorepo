import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: 'chat.general',
        prefetchCount: 10,
        queueOptions: {
          durable: true,
        },
      },
    },
  );
  await app.listen().then(() => {
    console.log(`Micro-server: rabbitMQ start on: ${5672}`);
  });
}
void bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get configuration service
  const configService = app.get(ConfigService);
  
  // Security middleware
  app.use(helmet());
  
  // Compression middleware
  app.use(compression());
  
  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('cors.origin'),
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Start server
  const port = configService.get<number>('port') || 3000;
  await app.listen(port);
  
  console.log(`🚀 Task AI Backend running on port ${port}`);
  console.log(`📊 Environment: ${configService.get<string>('environment')}`);
}
bootstrap();

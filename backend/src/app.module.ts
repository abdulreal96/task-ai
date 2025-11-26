import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { AiModule } from './ai/ai.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration module - loads .env based on NODE_ENV
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: process.env.NODE_ENV === 'production' 
        ? '.env.production' 
        : '.env.local',
    }),
    
    // MongoDB connection with dynamic configuration
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    
    AuthModule,
    
    UsersModule,
    
    TasksModule,
    
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.modules';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesModule } from './entities/entities.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { RolesModule } from './roles/roles.module';
import authConfig from './config/auth.config';
import { UsersModule } from './users/users.module';
import { ActivityTypesModule } from './activities-type/activity-types.module';
import { IdpIdentitiesModule } from './idp-identities/idp-identities.module';
import { ActivitiesModule } from './activity/activities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
    }),
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    EntitiesModule,
    AdminModule,
    RolesModule,
    UsersModule,
    ActivityTypesModule,
    IdpIdentitiesModule,
    ActivitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

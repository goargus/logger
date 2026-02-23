import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('should return API status', () => {
    const result = appController.getRootMessage();
    expect(result.status).toBe('ok');
    expect(result.message).toBe('API is running');
    expect(result).not.toHaveProperty('env');
  });
});

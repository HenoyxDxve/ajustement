import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('stats/public')
  getPublicStats() {
    return this.appService.getPublicStats();
  }

  @Get('config/public/banner')
  getBannerMessages() {
    return this.appService.getBannerMessages();
  }

  @Get('app/modules')
  getClientModules() {
    return this.appService.getClientModules();
  }
}

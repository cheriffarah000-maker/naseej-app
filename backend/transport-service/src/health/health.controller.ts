import { Controller, Get, Injectable, Res } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { register } from 'prom-client';
import type { Response } from 'express';

@Injectable()
@Controller()
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'transport-service', uptime: process.uptime() };
  }

  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    try {
      await this.ds.query('SELECT 1');
      return { status: 'ready', service: 'transport-service' };
    } catch {
      res.status(503);
      return { status: 'not-ready', service: 'transport-service' };
    }
  }

  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}

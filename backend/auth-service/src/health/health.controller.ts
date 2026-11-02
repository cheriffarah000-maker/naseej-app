import { Controller, Get, Inject, Res } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { register } from 'prom-client';
import type { Response } from 'express';

@Controller()
export class HealthController {
  constructor(@Inject(DataSource) private readonly ds: DataSource) {}

  /** Liveness: is the process alive? Kubernetes restarts the pod if this fails. */
  @Get('health')
  health() {
    return { status: 'ok', service: 'auth-service', uptime: process.uptime() };
  }

  /** Readiness: can we actually serve traffic? (DB reachable) */
  @Get('ready')
  async ready(@Res({ passthrough: true }) res: Response) {
    try {
      await this.ds.query('SELECT 1');
      return { status: 'ready', service: 'auth-service' };
    } catch {
      res.status(503);
      return { status: 'not-ready', service: 'auth-service' };
    }
  }

  /** Prometheus scrape endpoint. */
  @Get('metrics')
  async metrics(@Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}

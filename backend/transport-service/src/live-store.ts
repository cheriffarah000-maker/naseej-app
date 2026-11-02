import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface LivePosition {
  lat: number;
  lng: number;
  ts: number;
}

/**
 * Live bus positions live in Redis because they are written every few seconds
 * and read by every student on the route. Redis keeps them in memory.
 *
 * If Redis is not reachable the store silently falls back to a process-local
 * Map: the demo keeps working, and we log a warning instead of crashing.
 */
@Injectable()
export class LiveStore implements OnModuleDestroy {
  private readonly log = new Logger(LiveStore.name);
  private readonly memory = new Map<string, LivePosition>();
  private redis: Redis | null = null;
  private redisReady = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.log.warn('REDIS_URL not set - using in-memory live positions');
      return;
    }

    try {
      this.redis = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // never loop forever in a broken environment
        enableOfflineQueue: false,
      });

      this.redis.on('error', (err) => {
        if (this.redisReady) this.log.warn(`Redis error: ${err.message}`);
        this.redisReady = false;
      });

      this.redis
        .connect()
        .then(() => {
          this.redisReady = true;
          this.log.log('connected to Redis');
        })
        .catch(() => {
          this.redis = null;
          this.log.warn('Redis unavailable - using in-memory live positions');
        });
    } catch {
      this.redis = null;
    }
  }

  async set(busId: string, lat: number, lng: number): Promise<LivePosition> {
    const position: LivePosition = { lat, lng, ts: Date.now() };
    this.memory.set(busId, position);

    if (this.redis && this.redisReady) {
      try {
        await this.redis.set(`bus:${busId}`, JSON.stringify(position), 'EX', 300);
      } catch {
        this.redisReady = false;
      }
    }
    return position;
  }

  async get(busId: string): Promise<LivePosition | null> {
    if (this.redis && this.redisReady) {
      try {
        const raw = await this.redis.get(`bus:${busId}`);
        if (raw) return JSON.parse(raw) as LivePosition;
      } catch {
        this.redisReady = false;
      }
    }
    return this.memory.get(busId) ?? null;
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }
}

import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TransportService } from './transport.service';
import { Bus } from './entities/transport.entities';

/**
 * Real-time channel for the map.
 *
 * Students join a room called "route:<id>" and only receive updates for their
 * own line. Drivers push positions with the "driver:location" event.
 *
 * Everything is a plain message on purpose: swapping WebSockets for Server-Sent
 * Events or adding an SMS/push worker later does not change the service API.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class TransportGateway implements OnGatewayConnection {
  private readonly log = new Logger(TransportGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly transport: TransportService) {}

  handleConnection(client: Socket) {
    this.log.debug(`socket connected ${client.id}`);
  }

  /** Student subscribes to one route and immediately gets the current picture. */
  @SubscribeMessage('subscribe')
  async subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { routeId: string },
  ) {
    if (!body?.routeId) return;
    await client.join(`route:${body.routeId}`);
    client.emit('route:snapshot', await this.transport.live(body.routeId));
  }

  /** Driver app (or the admin "simulate" button) pushes a new GPS point. */
  @SubscribeMessage('driver:location')
  async driverLocation(@MessageBody() body: { busId: string; lat: number; lng: number }) {
    if (!body?.busId) return;
    const { bus } = await this.transport.updatePosition(body.busId, body.lat, body.lng);
    this.broadcastPosition(bus, body.lat, body.lng);
  }

  broadcastPosition(bus: Bus, lat: number, lng: number) {
    this.server?.to(`route:${bus.routeId}`).emit('bus:location', {
      busId: bus.id,
      plate: bus.plate,
      lat,
      lng,
      ts: Date.now(),
    });
  }

  broadcastStatus(bus: Bus) {
    this.server?.to(`route:${bus.routeId}`).emit('bus:status', {
      busId: bus.id,
      plate: bus.plate,
      status: bus.status,
    });
  }
}

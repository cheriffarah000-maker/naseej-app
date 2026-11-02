import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransportService } from './transport.service';
import { TransportGateway } from './transport.gateway';
import {
  CreateBusDto,
  CreateRouteDto,
  CreateUniversityDto,
  UpdateBusStatusDto,
  UpdatePositionDto,
} from './dto/transport.dto';
import { JwtAuthGuard, Roles, RolesGuard } from './common/jwt-auth.guard';

@Controller('api/v1/transport')
export class TransportController {
  constructor(
    private readonly transport: TransportService,
    private readonly gateway: TransportGateway,
  ) {}

  // ------------------------------ universities ------------------------------

  /** Public: students need the list before they even log in. */
  @Get('universities')
  universities() {
    return this.transport.listUniversities();
  }

  @Post('universities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createUniversity(@Body() dto: CreateUniversityDto) {
    return this.transport.createUniversity(dto);
  }

  // --------------------------------- routes ---------------------------------

  @Get('routes')
  routes(@Query('universityId') universityId?: string) {
    return this.transport.listRoutes(universityId);
  }

  @Post('routes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createRoute(@Body() dto: CreateRouteDto) {
    return this.transport.createRoute(dto);
  }

  // ---------------------------------- buses ---------------------------------

  @Get('buses')
  buses(@Query('routeId') routeId?: string) {
    return this.transport.listBuses(routeId);
  }

  @Get('live')
  live(@Query('routeId') routeId: string) {
    return this.transport.live(routeId);
  }

  @Post('buses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createBus(@Body() dto: CreateBusDto) {
    return this.transport.createBus(dto);
  }

  /** Drivers and admins can change the status shown to students. */
  @Patch('buses/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  async setStatus(@Param('id') id: string, @Body() dto: UpdateBusStatusDto) {
    const bus = await this.transport.setStatus(id, dto.status);
    // Students watching this route get the change instantly.
    this.gateway.broadcastStatus(bus);
    return bus;
  }

  /** Driver pushes GPS over HTTP (the WebSocket event does the same thing). */
  @Post('buses/:id/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('driver', 'admin')
  async pushLocation(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    const { bus, position } = await this.transport.updatePosition(id, dto.lat, dto.lng);
    this.gateway.broadcastPosition(bus, dto.lat, dto.lng);
    return position;
  }
}

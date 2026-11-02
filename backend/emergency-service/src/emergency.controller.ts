import {
  Body,
  Controller,
  Get,
  Param,
  ParseFloatPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EmergencyService, OFFICIAL_NOTICE } from './emergency.service';
import {
  AvailabilityDto,
  CreateHelpRequestDto,
  CreateProviderDto,
  ProviderLocationDto,
  UpdateRequestStatusDto,
} from './dto/emergency.dto';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { ProviderType } from './entities/provider.entity';

@Controller('api/v1/emergency')
export class EmergencyController {
  constructor(private readonly emergency: EmergencyService) {}

  /** Public: the mandatory safety notice, in all three languages. */
  @Get('notice')
  notice() {
    return { notice: OFFICIAL_NOTICE };
  }

  // ---------------------------- providers ----------------------------------

  /** Public on purpose: a citizen should see help without creating an account. */
  @Get('providers/nearby')
  nearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radius') radius?: string,
    @Query('type') type?: ProviderType,
  ) {
    return this.emergency.nearby(lat, lng, radius ? Number(radius) : 15, type);
  }

  @Get('providers/me')
  @UseGuards(JwtAuthGuard)
  myProfile(@Req() req: any) {
    return this.emergency.findMine(req.user.sub);
  }

  @Post('providers')
  @UseGuards(JwtAuthGuard)
  createProvider(@Req() req: any, @Body() dto: CreateProviderDto) {
    return this.emergency.upsertProvider(req.user.sub, dto);
  }

  @Patch('providers/me/availability')
  @UseGuards(JwtAuthGuard)
  setAvailability(@Req() req: any, @Body() dto: AvailabilityDto) {
    return this.emergency.setAvailability(req.user.sub, dto.isAvailable);
  }

  @Patch('providers/me/location')
  @UseGuards(JwtAuthGuard)
  updateLocation(@Req() req: any, @Body() dto: ProviderLocationDto) {
    return this.emergency.updateLocation(req.user.sub, dto);
  }

  // --------------------------- help requests --------------------------------

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  createRequest(@Req() req: any, @Body() dto: CreateHelpRequestDto) {
    return this.emergency.createRequest(req.user.sub, dto);
  }

  @Get('requests/me')
  @UseGuards(JwtAuthGuard)
  myRequests(@Req() req: any) {
    return this.emergency.myRequests(req.user.sub);
  }

  @Get('requests/incoming')
  @UseGuards(JwtAuthGuard)
  incoming(@Req() req: any) {
    return this.emergency.incoming(req.user.sub);
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard)
  getRequest(@Param('id') id: string) {
    return this.emergency.getRequest(id);
  }

  @Patch('requests/:id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.emergency.updateStatus(id, req.user.sub, req.user.role, dto.status);
  }
}

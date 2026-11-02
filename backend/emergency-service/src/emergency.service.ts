import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider, ProviderType } from './entities/provider.entity';
import { HelpRequest, RequestStatus } from './entities/help-request.entity';
import {
  CreateHelpRequestDto,
  CreateProviderDto,
  ProviderLocationDto,
} from './dto/emergency.dto';

/** Always returned with emergency data, in every language the client asks for. */
export const OFFICIAL_NOTICE = {
  en: 'In a life-threatening emergency, call the official emergency numbers first (SAMU 190 / Civil Protection 198).',
  fr: "En cas d'urgence vitale, appelez d'abord les numéros officiels (SAMU 190 / Protection Civile 198).",
  ar: 'في حالة الطوارئ القصوى، اتصل أولاً بالأرقام الرسمية (الإسعاف 190 / الحماية المدنية 198).',
};

export interface NearbyProvider {
  id: string;
  name: string;
  phone: string;
  type: ProviderType;
  serviceArea: string;
  isVerified: boolean;
  isAvailable: boolean;
  lat: number;
  lng: number;
  distanceKm: number;
}

@Injectable()
export class EmergencyService {
  private readonly log = new Logger(EmergencyService.name);

  constructor(
    @InjectRepository(Provider) private readonly providers: Repository<Provider>,
    @InjectRepository(HelpRequest) private readonly requests: Repository<HelpRequest>,
  ) {}

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  /** Create or update the provider profile owned by this user. */
  async upsertProvider(userId: string, dto: CreateProviderDto) {
    let provider = await this.providers.findOne({ where: { userId } });

    if (!provider) {
      provider = this.providers.create({ userId, ...dto, serviceArea: dto.serviceArea ?? '' });
      provider = await this.providers.save(provider);
    } else {
      Object.assign(provider, { ...dto, serviceArea: dto.serviceArea ?? provider.serviceArea });
      provider = await this.providers.save(provider);
    }

    await this.setLocation(provider.id, dto.lat, dto.lng);
    return this.findMine(userId);
  }

  async findMine(userId: string) {
    const provider = await this.providers.findOne({ where: { userId } });
    if (!provider) throw new NotFoundException('No provider profile for this user');
    const [row] = await this.providers.query(
      `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
         FROM providers WHERE id = $1`,
      [provider.id],
    );
    return { ...provider, location: undefined, lat: row?.lat ?? null, lng: row?.lng ?? null };
  }

  async setAvailability(userId: string, isAvailable: boolean) {
    const provider = await this.providers.findOne({ where: { userId } });
    if (!provider) throw new NotFoundException('No provider profile for this user');
    provider.isAvailable = isAvailable;
    await this.providers.save(provider);
    return this.findMine(userId);
  }

  async updateLocation(userId: string, dto: ProviderLocationDto) {
    const provider = await this.providers.findOne({ where: { userId } });
    if (!provider) throw new NotFoundException('No provider profile for this user');
    await this.setLocation(provider.id, dto.lat, dto.lng);
    return this.findMine(userId);
  }

  /** PostGIS writes the point, so lat/lng can never be swapped. */
  private async setLocation(providerId: string, lat: number, lng: number) {
    await this.providers.query(
      `UPDATE providers
          SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        WHERE id = $3`,
      [lng, lat, providerId],
    );
  }

  /**
   * Nearest available providers, sorted by real distance.
   * ST_DWithin uses the spatial index; ST_Distance returns metres on geography.
   */
  async nearby(
    lat: number,
    lng: number,
    radiusKm = 15,
    type?: ProviderType,
  ): Promise<NearbyProvider[]> {
    const params: any[] = [lng, lat, radiusKm * 1000];
    let typeFilter = '';
    if (type) {
      params.push(type);
      typeFilter = `AND "type" = $4`;
    }

    const rows = await this.providers.query(
      `SELECT id, name, phone, "type", "serviceArea", "isVerified", "isAvailable",
              ST_Y(location::geometry) AS lat,
              ST_X(location::geometry) AS lng,
              ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 AS "distanceKm"
         FROM providers
        WHERE "isAvailable" = true
          AND location IS NOT NULL
          AND ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
          ${typeFilter}
        ORDER BY "distanceKm" ASC
        LIMIT 50`,
      params,
    );

    return rows.map((r: any) => ({
      ...r,
      lat: Number(r.lat),
      lng: Number(r.lng),
      distanceKm: Math.round(Number(r.distanceKm) * 10) / 10,
    }));
  }

  // ---------------------------------------------------------------------------
  // Help requests
  // ---------------------------------------------------------------------------

  /**
   * Create a request and dispatch it to the nearest available provider.
   * Candidates are returned too, so the UI can offer "call someone else".
   */
  async createRequest(citizenId: string, dto: CreateHelpRequestDto) {
    const candidates = await this.nearby(dto.lat, dto.lng, 25);
    const nearest = candidates[0] ?? null;

    const request = this.requests.create({
      citizenId,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      lat: dto.lat,
      lng: dto.lng,
      note: dto.note ?? '',
      providerId: nearest?.id ?? null,
      providerName: nearest?.name ?? null,
      providerPhone: nearest?.phone ?? null,
      status: RequestStatus.PENDING,
    });

    const saved = await this.requests.save(request);
    this.log.log(`help request ${saved.id} -> provider ${nearest?.name ?? 'none'}`);
    return { request: saved, candidates, notice: OFFICIAL_NOTICE };
  }

  async getRequest(id: string) {
    const request = await this.requests.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  myRequests(citizenId: string) {
    return this.requests.find({
      where: { citizenId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /** Requests waiting for THIS provider to accept or decline. */
  async incoming(userId: string) {
    const provider = await this.providers.findOne({ where: { userId } });
    if (!provider) return [];
    return this.requests.find({
      where: { providerId: provider.id, status: RequestStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  /**
   * Accept / decline / complete. Ownership is enforced here, not in the UI:
   * - the assigned provider may accept, decline or complete
   * - the citizen may cancel
   */
  async updateStatus(
    requestId: string,
    userId: string,
    role: string,
    status: RequestStatus,
  ) {
    const request = await this.getRequest(requestId);
    const provider = await this.providers.findOne({ where: { userId } });
    const isAssignedProvider = !!provider && request.providerId === provider.id;
    const isOwnerCitizen = request.citizenId === userId;

    if (status === RequestStatus.CANCELLED) {
      if (!isOwnerCitizen && role !== 'admin') {
        throw new ForbiddenException('Only the citizen can cancel this request');
      }
    } else if (!isAssignedProvider && role !== 'admin') {
      throw new ForbiddenException('Not your request');
    }

    request.status = status;
    return this.requests.save(request);
  }

  // ---------------------------------------------------------------------------
  // Demo data
  // ---------------------------------------------------------------------------

  /** Seeds a handful of providers around Tunis so the map is useful on day one. */
  async seedDemoData() {
    const count = await this.providers.count();
    if (count > 0) return;

    const demo = [
      { name: 'Ambulance El Hana', phone: '+21671000001', type: ProviderType.AMBULANCE, serviceArea: 'Tunis Centre', lat: 36.8189, lng: 10.1658 },
      { name: 'Croissant Rouge Ariana', phone: '+21671000002', type: ProviderType.AMBULANCE, serviceArea: 'Ariana', lat: 36.8625, lng: 10.1956 },
      { name: 'Ambulance Carthage', phone: '+21671000003', type: ProviderType.AMBULANCE, serviceArea: 'Carthage', lat: 36.8528, lng: 10.3233 },
      { name: 'Le Bardo Rescue', phone: '+21671000004', type: ProviderType.AMBULANCE, serviceArea: 'Le Bardo', lat: 36.8080, lng: 10.1400 },
      { name: 'Sami Ben Ali', phone: '+21671000005', type: ProviderType.VOLUNTEER, serviceArea: 'Tunis Centre', lat: 36.8065, lng: 10.1815 },
      { name: 'Nour First Aid', phone: '+21671000006', type: ProviderType.VOLUNTEER, serviceArea: 'La Marsa', lat: 36.8780, lng: 10.3247 },
    ];

    for (let i = 0; i < demo.length; i++) {
      const d = demo[i];
      const provider = await this.providers.save(
        this.providers.create({
          userId: `seed-provider-${i}`,
          name: d.name,
          phone: d.phone,
          type: d.type,
          serviceArea: d.serviceArea,
          isAvailable: true,
          isVerified: i % 2 === 0,
        }),
      );
      await this.setLocation(provider.id, d.lat, d.lng);
    }
    this.log.log(`seeded ${demo.length} demo providers`);
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus, BusStatus, Route, University } from './entities/transport.entities';
import { LiveStore } from './live-store';

export interface BusWithPosition extends Bus {
  live: { lat: number; lng: number; ts: number } | null;
}

@Injectable()
export class TransportService {
  private readonly log = new Logger(TransportService.name);

  constructor(
    @InjectRepository(University) private readonly universities: Repository<University>,
    @InjectRepository(Route) private readonly routes: Repository<Route>,
    @InjectRepository(Bus) private readonly buses: Repository<Bus>,
    private readonly liveStore: LiveStore,
  ) {}

  // ------------------------------ universities ------------------------------

  listUniversities() {
    return this.universities.find({ order: { name: 'ASC' } });
  }

  createUniversity(data: Partial<University>) {
    return this.universities.save(this.universities.create(data));
  }

  // --------------------------------- routes ---------------------------------

  listRoutes(universityId?: string) {
    return this.routes.find({
      where: universityId ? { universityId } : {},
      order: { name: 'ASC' },
    });
  }

  createRoute(data: Partial<Route>) {
    return this.routes.save(this.routes.create(data));
  }

  // ---------------------------------- buses ---------------------------------

  listBuses(routeId?: string) {
    return this.buses.find({
      where: routeId ? { routeId } : {},
      order: { plate: 'ASC' },
    });
  }

  async createBus(data: Partial<Bus>) {
    const bus = await this.buses.save(this.buses.create(data));
    return bus;
  }

  async setStatus(busId: string, status: BusStatus) {
    const bus = await this.buses.findOne({ where: { id: busId } });
    if (!bus) throw new NotFoundException('Bus not found');
    bus.status = status;
    await this.buses.save(bus);
    this.log.log(`bus ${bus.plate} -> ${status}`);
    return bus;
  }

  /**
   * Driver sends GPS. We keep the latest position in Redis (fast reads for the
   * map) and mirror it in Postgres (so a restart keeps the last known point).
   */
  async updatePosition(busId: string, lat: number, lng: number) {
    const bus = await this.buses.findOne({ where: { id: busId } });
    if (!bus) throw new NotFoundException('Bus not found');

    const position = await this.liveStore.set(busId, lat, lng);

    // Only write the mirror every time - it is a single cheap UPDATE, and it
    // means the bus does not "jump" after a service restart.
    await this.buses.update({ id: busId }, { currentLat: lat, currentLng: lng });

    return { bus, position };
  }

  /** Buses on a route, with their live position when available. */
  async live(routeId: string): Promise<BusWithPosition[]> {
    const buses = await this.listBuses(routeId);
    return Promise.all(
      buses.map(async (bus) => {
        const stored = await this.liveStore.get(bus.id);
        const live =
          stored ??
          (bus.currentLat != null && bus.currentLng != null
            ? { lat: bus.currentLat, lng: bus.currentLng, ts: 0 }
            : null);
        return Object.assign(bus, { live });
      }),
    );
  }

  // ---------------------------------- demo ----------------------------------

  /** Seeds Tunisian universities, one route each and a demo bus. */
  async seedDemoData() {
    if ((await this.universities.count()) > 0) return;

    const seed = [
      {
        name: 'Université de Tunis El Manar',
        city: 'Tunis',
        lat: 36.8089,
        lng: 10.1407,
        route: 'Cité Universitaire - El Manar',
        stations: [
          { name: 'Bab Saadoun', lat: 36.8096, lng: 10.1574 },
          { name: 'Bouchoucha', lat: 36.8056, lng: 10.1493 },
          { name: 'El Manar', lat: 36.8089, lng: 10.1407 },
        ],
        bus: 'RS 1012',
        plate: 'TUN 2345',
      },
      {
        name: 'Université de Carthage',
        city: 'Tunis',
        lat: 36.8528,
        lng: 10.3233,
        route: 'La Marsa - Carthage Présidence',
        stations: [
          { name: 'La Marsa', lat: 36.878, lng: 10.3247 },
          { name: 'Sidi Bou Said', lat: 36.8704, lng: 10.3417 },
          { name: 'Carthage', lat: 36.8528, lng: 10.3233 },
        ],
        bus: 'RS 2010',
        plate: 'TUN 7781',
      },
      {
        name: 'Université de Sousse',
        city: 'Sousse',
        lat: 35.8288,
        lng: 10.6402,
        route: 'Sousse Ville - Campus',
        stations: [
          { name: 'Bab Bhar', lat: 35.8286, lng: 10.6387 },
          { name: 'Khezama', lat: 35.8603, lng: 10.6005 },
          { name: 'Campus', lat: 35.8288, lng: 10.6402 },
        ],
        bus: 'RS 3300',
        plate: 'TUN 5510',
      },
      {
        name: 'Université de Sfax',
        city: 'Sfax',
        lat: 34.7406,
        lng: 10.7603,
        route: 'Sfax Centre - Campus',
        stations: [
          { name: 'Bab Diwan', lat: 34.7349, lng: 10.7601 },
          { name: 'Sakiet Ezzit', lat: 34.7833, lng: 10.7333 },
          { name: 'Campus', lat: 34.7406, lng: 10.7603 },
        ],
        bus: 'RS 4400',
        plate: 'TUN 9933',
      },
    ];

    for (const item of seed) {
      const university = await this.universities.save(
        this.universities.create({
          name: item.name,
          city: item.city,
          lat: item.lat,
          lng: item.lng,
        }),
      );

      const route = await this.routes.save(
        this.routes.create({
          name: item.route,
          universityId: university.id,
          color: '#0073E6',
          stations: item.stations,
        }),
      );

      const bus = await this.buses.save(
        this.buses.create({
          plate: item.plate,
          routeId: route.id,
          capacity: 30,
          status: BusStatus.ON_THE_WAY,
          currentLat: item.stations[0].lat,
          currentLng: item.stations[0].lng,
        }),
      );

      await this.liveStore.set(bus.id, item.stations[0].lat, item.stations[0].lng);
    }

    this.log.log(`seeded ${seed.length} universities with routes and buses`);
  }
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** A stop on a route (kept as JSONB: cheap to read, always returned with the route). */
export interface Station {
  name: string;
  lat: number;
  lng: number;
}

@Entity('universities')
export class University {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: '' })
  city: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  universityId: string;

  /** Hex colour used on the map so each line is recognisable. */
  @Column({ default: '#0073E6' })
  color: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  stations: Station[];

  @CreateDateColumn()
  createdAt: Date;
}

export enum BusStatus {
  ON_THE_WAY = 'on_the_way',
  FULL = 'full',
  NOT_RUNNING = 'not_running',
  DELAYED = 'delayed',
  CANCELED = 'canceled',
}

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  plate: string;

  @Column()
  routeId: string;

  /** auth-service user id of the driver (nullable until a driver is assigned). */
  @Column({ nullable: true })
  driverId: string | null;

  @Column({ default: 30 })
  capacity: number;

  @Column({ type: 'enum', enum: BusStatus, default: BusStatus.NOT_RUNNING })
  status: BusStatus;

  /** Last known position, mirrored from Redis so a restart does not lose the bus. */
  @Column({ type: 'double precision', nullable: true })
  currentLat: number | null;

  @Column({ type: 'double precision', nullable: true })
  currentLng: number | null;

  @UpdateDateColumn()
  updatedAt: Date;
}

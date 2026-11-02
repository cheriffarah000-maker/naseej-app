import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ProviderType {
  AMBULANCE = 'ambulance',
  VOLUNTEER = 'volunteer',
}

/**
 * A private ambulance or a first-aid volunteer.
 * NOTE: this service is NOT the official emergency service — it never replaces
 * SAMU 190 / Civil Protection 198, and the API always returns that notice.
 */
@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Owner of this provider profile (from auth-service JWT "sub"). */
  @Column({ unique: true })
  userId: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ type: 'enum', enum: ProviderType })
  type: ProviderType;

  /** Free text, e.g. "Ariana, Tunis". */
  @Column({ default: '' })
  serviceArea: string;

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ default: false })
  isVerified: boolean;

  /**
   * PostGIS geography point. Written with ST_MakePoint so we never have to
   * trust the client's coordinate ordering.
   */
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: any | null;

  @CreateDateColumn()
  createdAt: Date;
}

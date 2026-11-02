import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * A citizen asking a private provider for help.
 * The citizen's contact details are copied in (denormalised on purpose) so this
 * service never has to read the auth-service database.
 */
@Entity('help_requests')
export class HelpRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  citizenId: string;

  @Column()
  contactName: string;

  @Column()
  contactPhone: string;

  @Column({ type: 'double precision' })
  lat: number;

  @Column({ type: 'double precision' })
  lng: number;

  @Column({ default: '' })
  note: string;

  /** The provider currently responsible for this request (nearest at creation). */
  @Column({ nullable: true })
  providerId: string | null;

  @Column({ nullable: true })
  providerName: string | null;

  @Column({ nullable: true })
  providerPhone: string | null;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** The six roles of the Naseej platform. */
export enum UserRole {
  CITIZEN = 'citizen',
  STUDENT = 'student',
  PROVIDER = 'provider',
  DRIVER = 'driver',
  ADMIN = 'admin',
  VOLUNTEER = 'volunteer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  /** Stored E.164, e.g. +21612345678 */
  @Column({ unique: true })
  phone: string;

  /** bcrypt hash — never the plain password. */
  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CITIZEN })
  role: UserRole;

  /** Location is only stored when the user explicitly opts in. */
  @Column({ default: false })
  locationConsent: boolean;

  @Column({ type: 'double precision', nullable: true })
  lastLat: number | null;

  @Column({ type: 'double precision', nullable: true })
  lastLng: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastPositionAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

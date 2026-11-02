export type Role = 'citizen' | 'student' | 'provider' | 'volunteer' | 'driver' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  locationConsent: boolean;
  lastLat: number | null;
  lastLng: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type ProviderType = 'ambulance' | 'volunteer';

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

export interface ProviderProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  type: ProviderType;
  serviceArea: string;
  isAvailable: boolean;
  isVerified: boolean;
  lat: number | null;
  lng: number | null;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export interface HelpRequest {
  id: string;
  citizenId: string;
  contactName: string;
  contactPhone: string;
  lat: number;
  lng: number;
  note: string;
  providerId: string | null;
  providerName: string | null;
  providerPhone: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface University {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
}

export interface Station {
  name: string;
  lat: number;
  lng: number;
}

export interface BusRoute {
  id: string;
  name: string;
  universityId: string;
  color: string;
  stations: Station[];
}

export type BusStatus = 'on_the_way' | 'full' | 'not_running' | 'delayed' | 'canceled';

export interface Bus {
  id: string;
  plate: string;
  routeId: string;
  driverId: string | null;
  capacity: number;
  status: BusStatus;
  currentLat: number | null;
  currentLng: number | null;
  live?: { lat: number; lng: number; ts: number } | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  Bus,
  BusStatus,
  HelpRequest,
  NearbyProvider,
  ProviderProfile,
  ProviderType,
  RequestStatus,
  University,
  BusRoute,
  User,
} from './types';

const ACCESS_KEY = 'naseej.access';
const REFRESH_KEY = 'naseej.refresh';

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  save(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

/**
 * Same-origin base URL: Vite proxies /api to the gateway in development, and
 * Ingress routes /api to the gateway in Kubernetes. No host is hardcoded.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const access = tokens.access;
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Only one refresh call at a time, even if five requests fail together.
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = tokens.refresh;
  if (!refreshToken) return null;

  refreshInFlight = axios
    .post<AuthResponse>((import.meta.env.VITE_API_BASE ?? '') + '/api/v1/auth/refresh', {
      refreshToken,
    })
    .then((res) => {
      tokens.save(res.data.accessToken, res.data.refreshToken);
      return res.data.accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      const fresh = await refreshAccessToken();
      if (fresh) {
        original.headers.Authorization = `Bearer ${fresh}`;
        return http(original);
      }
      tokens.clear();
      window.dispatchEvent(new Event('naseej:logout'));
    }

    return Promise.reject(error);
  },
);

/** Turns a server error into a translation key the UI can render. */
export function errorKey(err: unknown): string {
  const ax = err as AxiosError<any>;
  const message = ax?.response?.data?.message;
  if (Array.isArray(message)) return String(message[0]);
  if (typeof message === 'string' && message.includes('.')) return message;
  if (ax?.response?.status === 401) return 'errors.unauthorized';
  if (ax?.code === 'ECONNABORTED') return 'errors.timeout';
  if (!ax?.response) return 'errors.network';
  return 'errors.generic';
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) => http.post<AuthResponse>('/api/v1/auth/register', body).then((r) => r.data),

  login: (body: { identifier: string; password: string }) =>
    http.post<AuthResponse>('/api/v1/auth/login', body).then((r) => r.data),

  me: () => http.get<User>('/api/v1/auth/me').then((r) => r.data),

  saveLocation: (lat: number, lng: number, consent: boolean) =>
    http.patch<User>('/api/v1/auth/me/location', { lat, lng, consent }).then((r) => r.data),

  listUsers: () => http.get<User[]>('/api/v1/auth/users').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Emergency
// ---------------------------------------------------------------------------
export const emergencyApi = {
  nearby: (lat: number, lng: number, radiusKm = 15, type?: ProviderType) =>
    http
      .get<NearbyProvider[]>('/api/v1/emergency/providers/nearby', {
        params: { lat, lng, radius: radiusKm, type },
      })
      .then((r) => r.data),

  myProvider: () => http.get<ProviderProfile>('/api/v1/emergency/providers/me').then((r) => r.data),

  becomeProvider: (body: {
    name: string;
    phone: string;
    type: ProviderType;
    serviceArea?: string;
    lat: number;
    lng: number;
  }) => http.post<ProviderProfile>('/api/v1/emergency/providers', body).then((r) => r.data),

  setAvailability: (isAvailable: boolean) =>
    http
      .patch<ProviderProfile>('/api/v1/emergency/providers/me/availability', { isAvailable })
      .then((r) => r.data),

  updateProviderLocation: (lat: number, lng: number) =>
    http
      .patch<ProviderProfile>('/api/v1/emergency/providers/me/location', { lat, lng })
      .then((r) => r.data),

  createRequest: (body: {
    lat: number;
    lng: number;
    note?: string;
    contactName: string;
    contactPhone: string;
  }) =>
    http
      .post<{ request: HelpRequest; candidates: NearbyProvider[] }>(
        '/api/v1/emergency/requests',
        body,
      )
      .then((r) => r.data),

  myRequests: () => http.get<HelpRequest[]>('/api/v1/emergency/requests/me').then((r) => r.data),

  incoming: () => http.get<HelpRequest[]>('/api/v1/emergency/requests/incoming').then((r) => r.data),

  getRequest: (id: string) =>
    http.get<HelpRequest>(`/api/v1/emergency/requests/${id}`).then((r) => r.data),

  setStatus: (id: string, status: RequestStatus) =>
    http
      .patch<HelpRequest>(`/api/v1/emergency/requests/${id}/status`, { status })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
export const transportApi = {
  universities: () => http.get<University[]>('/api/v1/transport/universities').then((r) => r.data),

  routes: (universityId?: string) =>
    http
      .get<BusRoute[]>('/api/v1/transport/routes', { params: { universityId } })
      .then((r) => r.data),

  buses: (routeId?: string) =>
    http.get<Bus[]>('/api/v1/transport/buses', { params: { routeId } }).then((r) => r.data),

  live: (routeId: string) =>
    http.get<Bus[]>('/api/v1/transport/live', { params: { routeId } }).then((r) => r.data),

  createUniversity: (body: { name: string; city?: string; lat: number; lng: number }) =>
    http.post<University>('/api/v1/transport/universities', body).then((r) => r.data),

  createRoute: (body: { name: string; universityId: string; stations: any[]; color?: string }) =>
    http.post<BusRoute>('/api/v1/transport/routes', body).then((r) => r.data),

  createBus: (body: { plate: string; routeId: string; capacity?: number }) =>
    http.post<Bus>('/api/v1/transport/buses', body).then((r) => r.data),

  setBusStatus: (id: string, status: BusStatus) =>
    http.patch<Bus>(`/api/v1/transport/buses/${id}/status`, { status }).then((r) => r.data),

  pushBusLocation: (id: string, lat: number, lng: number) =>
    http.post(`/api/v1/transport/buses/${id}/location`, { lat, lng }).then((r) => r.data),
};

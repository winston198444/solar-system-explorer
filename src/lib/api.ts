import { API_BASE, API_KEY } from '../config';
import type { Body } from './model';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type QueryParam = string | number | string[] | undefined;

function buildUrl(path: string, params?: Record<string, QueryParam>): string {
  const url = new URL(API_BASE + path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(path: string, params?: Record<string, QueryParam>): Promise<T> {
  // In proxy mode API_KEY is empty and the proxy injects the key server-side.
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
  }
  const response = await fetch(buildUrl(path, params), { headers });
  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, detail || `Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export interface BodiesResponse {
  bodies: Body[];
}

export interface KnownCountItem {
  id: string;
  knownCount: number;
  updateDate: string;
  rel: string;
}

export interface KnownCountResponse {
  knowncount: KnownCountItem[];
}

export interface PositionQuery {
  lat: number;
  lon: number;
  elev: number;
  datetime: string;
  zone: number;
}

export interface PositionResult {
  name: string;
  ra: string;
  dec: string;
  az: string;
  alt: string;
}

export interface PositionsResponse {
  positions: PositionResult[];
  location: { latitude: number; longitude: number; elevation: number; timezone: number };
  time_info: {
    calculated_for_utc: string;
    local_time_display: string;
    universal_time_ut: string;
    universal_time_decimal: number;
    julian_day: number;
    day_number_j2000: number;
    greenwich_sidereal_time: string;
    local_sidereal_time: string;
    gst_decimal: number;
    lst_decimal: number;
  };
}

export interface BodyQuery {
  data?: string;
  exclude?: string;
  order?: string;
  page?: string;
  filter?: string[];
  satisfy?: 'any';
}

export const api = {
  bodies: (query: BodyQuery = {}) =>
    request<BodiesResponse>('/rest/bodies', {
      data: query.data,
      exclude: query.exclude,
      order: query.order,
      page: query.page,
      filter: query.filter,
      satisfy: query.satisfy,
    }),

  body: (id: string) => request<Body>(`/rest/bodies/${encodeURIComponent(id)}`),

  knownCount: () => request<KnownCountResponse>('/rest/knowncount'),

  positions: (q: PositionQuery) =>
    request<PositionsResponse>('/rest/positions', {
      lat: q.lat,
      lon: q.lon,
      elev: q.elev,
      datetime: q.datetime,
      zone: q.zone,
    }),
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

/**
 * Fetches every body with its full data (the API paginates at 20
 * by default but accepts page sizes up to at least 1000, so the
 * full catalog — ~500 KB — fits in a single request). The loop
 * guards against servers that cap the page size.
 */
export async function fetchAllBodies(): Promise<Body[]> {
  const bodies: Body[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await api.bodies({
      order: 'id,asc',
      page: `${page},${PAGE_SIZE}`,
    });
    bodies.push(...res.bodies);
    if (res.bodies.length < PAGE_SIZE) break;
  }
  return bodies;
}

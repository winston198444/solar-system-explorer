export type BodyType = 'Planet' | 'Dwarf Planet' | 'Moon' | 'Asteroid' | 'Comet' | 'Star';

export const BODY_TYPES: BodyType[] = [
  'Planet',
  'Dwarf Planet',
  'Moon',
  'Asteroid',
  'Comet',
  'Star',
];

export interface MassValue {
  massValue: number;
  massExponent: number;
}

export interface VolValue {
  volValue: number;
  volExponent: number;
}

export interface MoonReference {
  moon: string;
  rel: string;
}

export interface AroundPlanetReference {
  planet: string;
  rel: string;
}

/** A solar system body as returned by api.le-systeme-solaire.net. */
export interface Body {
  id: string;
  name: string;
  englishName: string;
  isPlanet: boolean;
  moons: MoonReference[] | null;
  semimajorAxis: number;
  perihelion: number;
  aphelion: number;
  eccentricity: number;
  inclination: number;
  mass: MassValue | null;
  vol: VolValue | null;
  density: number;
  gravity: number;
  escape: number;
  meanRadius: number;
  equaRadius: number;
  polarRadius: number;
  flattening: number;
  dimension: string;
  sideralOrbit: number;
  sideralRotation: number;
  aroundPlanet: AroundPlanetReference | null;
  discoveredBy: string;
  discoveryDate: string;
  alternativeName: string;
  axialTilt: number;
  avgTemp: number;
  mainAnomaly: number;
  argPeriapsis: number;
  longAscNode: number;
  bodyType: string;
  rel: string;
}

/**
 * Fields for which the API returns 0 to mean "unknown" (observed in the
 * API data, e.g. Mercury avgTemp = 0, Halley sideralOrbit = 0).
 * Legitimate zeros (eccentricity, inclination, flattening, axialTilt…)
 * are intentionally NOT in this set.
 */
const ZERO_MEANS_UNKNOWN = new Set([
  'avgTemp',
  'gravity',
  'escape',
  'semimajorAxis',
  'perihelion',
  'aphelion',
  'sideralOrbit',
  'sideralRotation',
  'volValue',
  'meanRadius',
  'equaRadius',
  'polarRadius',
]);

/** Returns the number, or null when the API "0 means unknown" applies. */
export function knownNumber(value: number | null | undefined, field: string): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (value === 0 && ZERO_MEANS_UNKNOWN.has(field)) return null;
  return value;
}

/** Returns the text, or null when empty (the API uses "" for "unknown"). */
export function knownText(value: string | null | undefined): string | null {
  if (!value) return null;
  return value;
}

/** Extracts the body id (slug) from an API "rel" link. */
export function idFromRel(rel: string | null | undefined): string | null {
  if (!rel) return null;
  const parts = rel.split('/');
  return parts[parts.length - 1] || null;
}

/** Sortable numeric mass in kg. */
export function massKg(body: Body): number {
  if (!body.mass) return 0;
  return body.mass.massValue * 10 ** body.mass.massExponent;
}

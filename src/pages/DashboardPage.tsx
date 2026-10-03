import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, fetchAllBodies } from '../lib/api';
import { BODY_TYPES, type BodyType } from '../lib/model';
import { formatNumber } from '../lib/format';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/States';
import BodyCard from '../components/BodyCard';
import { typeClass } from '../components/Badge';

const KNOWN_COUNT_LABELS: Record<string, string> = {
  planet: 'Planets',
  dwarfPlanet: 'Dwarf planets',
  asteroid: 'Asteroids',
  comet: 'Comets',
  moonsPlanet: 'Moons of planets',
  moonsDwarfPlanet: 'Moons of dwarf planets',
  moonsAsteroid: 'Moons of asteroids',
  moonsJupiter: "Jupiter's moons",
  moonsSaturn: "Saturn's moons",
  moonsUranus: "Uranus' moons",
  moonsNeptune: "Neptune's moons",
};

const TYPE_ICONS: Record<BodyType, string> = {
  Planet: '🪐',
  'Dwarf Planet': '🔵',
  Moon: '🌙',
  Asteroid: '☄️',
  Comet: '💫',
  Star: '⭐',
};

const PLANET_ORDER = [
  'mercure',
  'venus',
  'terre',
  'mars',
  'jupiter',
  'saturne',
  'uranus',
  'neptune',
];

export default function DashboardPage() {
  const counts = useQuery({
    queryKey: ['knowncount'],
    queryFn: api.knownCount,
  });

  const bodies = useQuery({
    queryKey: ['bodies'],
    queryFn: fetchAllBodies,
  });

  const loading = counts.isLoading || bodies.isLoading;
  const error = counts.error ?? bodies.error;

  const all = bodies.data ?? [];
  const byType = new Map<string, number>();
  for (const b of all) byType.set(b.bodyType, (byType.get(b.bodyType) ?? 0) + 1);

  const planets = [...all]
    .filter((b) => b.bodyType === 'Planet')
    .sort(
      (a, b) =>
        PLANET_ORDER.indexOf(a.id) - PLANET_ORDER.indexOf(b.id),
    );
  const sun = all.find((b) => b.id === 'soleil');

  return (
    <div className="page">
      <section className="hero">
        <h1>Explore the Solar System</h1>
        <p>
          Planets, dwarf planets, moons, asteroids and comets — every object
          catalogued by the Solar System openData API.
        </p>
        {bodies.data ? (
          <p className="hero-total">
            <strong>{formatNumber(all.length)}</strong> objects in this catalog
          </p>
        ) : null}
      </section>

      {loading && <Skeleton lines={4} />}
      {error && <ErrorState error={error} onRetry={() => counts.refetch()} />}

      {counts.data && (
        <section aria-labelledby="known-heading">
          <h2 id="known-heading">Official totals for the whole Solar System</h2>
          <div className="stat-grid">
            {counts.data.knowncount
              .filter((item) => KNOWN_COUNT_LABELS[item.id])
              .slice(0, 8)
              .map((item) => (
                <StatCard
                  key={item.id}
                  label={KNOWN_COUNT_LABELS[item.id]}
                  value={formatNumber(item.knownCount)}
                  sub={item.updateDate}
                />
              ))}
          </div>
        </section>
      )}

      {all.length > 0 && (
        <section aria-labelledby="types-heading">
          <h2 id="types-heading">Detailed records in this catalog</h2>
          <div className="type-grid">
            {BODY_TYPES.filter((t) => byType.has(t)).map((type) => (
              <Link
                key={type}
                to={`/catalog?type=${encodeURIComponent(type)}`}
                className={`type-card ${typeClass(type)}`}
              >
                <span className="type-icon" aria-hidden="true">
                  {TYPE_ICONS[type]}
                </span>
                <span className="type-name">{type}s</span>
                <span className="type-count">
                  {formatNumber(byType.get(type) ?? 0)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {all.length > 0 && (
        <section aria-labelledby="planets-heading">
          <h2 id="planets-heading">The Sun &amp; planets</h2>
          <div className="card-grid">
            {sun ? <BodyCard body={sun} /> : null}
            {planets.map((p) => (
              <BodyCard key={p.id} body={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

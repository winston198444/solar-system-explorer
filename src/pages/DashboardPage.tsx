import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, fetchAllBodies } from '../lib/api';
import { BODY_TYPES, type BodyType } from '../lib/model';
import { formatNumber } from '../lib/format';
import { useI18n, type DictKey } from '../i18n';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/States';
import BodyCard from '../components/BodyCard';
import { typeClass } from '../components/Badge';

const KNOWN_COUNT_LABELS: Record<string, DictKey> = {
  planet: 'stat.planet',
  dwarfPlanet: 'stat.dwarfPlanet',
  asteroid: 'stat.asteroid',
  comet: 'stat.comet',
  moonsPlanet: 'stat.moonsPlanet',
  moonsDwarfPlanet: 'stat.moonsDwarfPlanet',
  moonsAsteroid: 'stat.moonsAsteroid',
  moonsJupiter: 'stat.moonsJupiter',
  moonsSaturn: 'stat.moonsSaturn',
  moonsUranus: 'stat.moonsUranus',
  moonsNeptune: 'stat.moonsNeptune',
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
  const { t, typeLabel } = useI18n();
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
        <h1>{t('dashboard.title')}</h1>
        <p>{t('dashboard.subtitle')}</p>
        {bodies.data ? (
          <p className="hero-total">
            <strong>{formatNumber(all.length)}</strong> {t('dashboard.total')}
          </p>
        ) : null}
      </section>

      {loading && <Skeleton lines={4} />}
      {error && <ErrorState error={error} onRetry={() => counts.refetch()} />}

      {counts.data && (
        <section aria-labelledby="known-heading">
          <h2 id="known-heading">{t('dashboard.officialTotals')}</h2>
          <div className="stat-grid">
            {counts.data.knowncount
              .filter((item) => KNOWN_COUNT_LABELS[item.id])
              .slice(0, 8)
              .map((item) => (
                <StatCard
                  key={item.id}
                  label={t(KNOWN_COUNT_LABELS[item.id])}
                  value={formatNumber(item.knownCount)}
                  sub={item.updateDate}
                />
              ))}
          </div>
        </section>
      )}

      {all.length > 0 && (
        <section aria-labelledby="types-heading">
          <h2 id="types-heading">{t('dashboard.catalogTotals')}</h2>
          <div className="type-grid">
            {BODY_TYPES.filter((t2) => byType.has(t2)).map((type) => (
              <Link
                key={type}
                to={`/catalog?type=${encodeURIComponent(type)}`}
                className={`type-card ${typeClass(type)}`}
              >
                <span className="type-icon" aria-hidden="true">
                  {TYPE_ICONS[type]}
                </span>
                <span className="type-name">{typeLabel(type, true)}</span>
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
          <h2 id="planets-heading">{t('dashboard.sunAndPlanets')}</h2>
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

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { idFromRel, knownNumber, knownText } from '../lib/model';
import {
  formatAngle,
  formatAu,
  formatDistance,
  formatNumber,
  formatPeriod,
  formatRotation,
  formatScientific,
  formatTemp,
} from '../lib/format';
import Field from '../components/Field';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/States';

export default function BodyDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['body', id],
    queryFn: () => api.body(id),
    enabled: !!id,
  });

  if (isLoading) return <div className="page"><Skeleton lines={8} /></div>;
  if (error)
    return (
      <div className="page">
        <ErrorState error={error} />
      </div>
    );
  if (!data) return null;

  const mass = data.mass;
  const vol = data.vol;
  const semimajor = knownNumber(data.semimajorAxis, 'semimajorAxis');
  const perihelion = knownNumber(data.perihelion, 'perihelion');
  const aphelion = knownNumber(data.aphelion, 'aphelion');
  const period = knownNumber(data.sideralOrbit, 'sideralOrbit');
  const rotation = knownNumber(data.sideralRotation, 'sideralRotation');
  const meanRadius = knownNumber(data.meanRadius, 'meanRadius');
  const equaRadius = knownNumber(data.equaRadius, 'equaRadius');
  const polarRadius = knownNumber(data.polarRadius, 'polarRadius');
  const flattening = knownNumber(data.flattening, 'flattening');
  const axialTilt = knownNumber(data.axialTilt, 'axialTilt');
  const temp = knownNumber(data.avgTemp, 'avgTemp');
  const gravity = knownNumber(data.gravity, 'gravity');
  const escape = knownNumber(data.escape, 'escape');
  const density = knownNumber(data.density, 'density');
  const eccentricity = knownNumber(data.eccentricity, 'eccentricity');
  const inclination = knownNumber(data.inclination, 'inclination');
  const mainAnomaly = knownNumber(data.mainAnomaly, 'mainAnomaly');
  const argPeriapsis = knownNumber(data.argPeriapsis, 'argPeriapsis');
  const longAscNode = knownNumber(data.longAscNode, 'longAscNode');
  const discoveredBy = knownText(data.discoveredBy);
  const discoveryDate = knownText(data.discoveryDate);
  const alternativeName = knownText(data.alternativeName);
  const dimension = knownText(data.dimension);

  const moons = data.moons ?? [];
  const parent = data.aroundPlanet;

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/catalog">Catalog</Link> / <span>{data.englishName}</span>
      </nav>

      <header className="detail-header">
        <div>
          <h1>{data.englishName || data.name}</h1>
          {data.name !== data.englishName && (
            <p className="detail-native">{data.name}</p>
          )}
          {alternativeName && (
            <p className="detail-alt">Also known as: {alternativeName}</p>
          )}
        </div>
        <Badge type={data.bodyType} />
      </header>

      <div className="detail-grid">
        <section className="panel" aria-labelledby="physical-heading">
          <h2 id="physical-heading">Physical characteristics</h2>
          <dl className="field-list">
            <Field
              label="Mass"
              value={
                mass
                  ? formatScientific(mass.massValue, mass.massExponent, 'kg')
                  : null
              }
            />
            <Field
              label="Volume"
              value={
                vol && vol.volValue !== 0
                  ? formatScientific(vol.volValue, vol.volExponent, 'km³')
                  : null
              }
            />
            <Field
              label="Density"
              value={density !== null ? `${density.toFixed(2)} g/cm³` : null}
            />
            <Field
              label="Surface gravity"
              value={gravity !== null ? `${gravity.toFixed(2)} m/s²` : null}
            />
            <Field
              label="Escape velocity"
              value={
                escape !== null
                  ? `${formatNumber(escape)} km/s`
                  : null
              }
            />
            <Field
              label="Mean radius"
              value={
                meanRadius !== null
                  ? formatDistance(meanRadius)
                  : null
              }
            />
            <Field
              label="Equatorial radius"
              value={equaRadius !== null ? formatDistance(equaRadius) : null}
            />
            <Field
              label="Polar radius"
              value={polarRadius !== null ? formatDistance(polarRadius) : null}
            />
            <Field
              label="Flattening"
              value={flattening !== null ? flattening.toFixed(4) : null}
            />
            <Field label="Dimensions" value={dimension} />
            <Field
              label="Axial tilt"
              value={axialTilt !== null ? formatAngle(axialTilt) : null}
            />
            <Field
              label="Average temperature"
              value={temp !== null ? formatTemp(temp) : null}
              title="Kelvin, converted to Celsius"
            />
          </dl>
        </section>

        <section className="panel" aria-labelledby="orbit-heading">
          <h2 id="orbit-heading">Orbit &amp; rotation</h2>
          <dl className="field-list">
            <Field
              label="Semi-major axis"
              value={
                semimajor !== null
                  ? `${formatDistance(semimajor)} (${formatAu(semimajor)})`
                  : null
              }
            />
            <Field
              label="Perihelion"
              value={
                perihelion !== null
                  ? `${formatDistance(perihelion)} (${formatAu(perihelion)})`
                  : null
              }
            />
            <Field
              label="Aphelion"
              value={
                aphelion !== null
                  ? `${formatDistance(aphelion)} (${formatAu(aphelion)})`
                  : null
              }
            />
            <Field
              label="Eccentricity"
              value={eccentricity !== null ? eccentricity.toFixed(4) : null}
            />
            <Field
              label="Inclination"
              value={inclination !== null ? formatAngle(inclination) : null}
            />
            <Field
              label="Mean anomaly"
              value={mainAnomaly !== null ? formatAngle(mainAnomaly) : null}
            />
            <Field
              label="Argument of periapsis"
              value={argPeriapsis !== null ? formatAngle(argPeriapsis) : null}
            />
            <Field
              label="Longitude of ascending node"
              value={longAscNode !== null ? formatAngle(longAscNode) : null}
            />
            <Field
              label="Orbital period"
              value={period !== null ? formatPeriod(period) : null}
            />
            <Field
              label="Rotation period"
              value={rotation !== null ? formatRotation(rotation) : null}
              title="Negative values indicate retrograde rotation"
            />
          </dl>
        </section>

        <section className="panel" aria-labelledby="discovery-heading">
          <h2 id="discovery-heading">Discovery</h2>
          <dl className="field-list">
            <Field label="Discovered by" value={discoveredBy} />
            <Field label="Discovery date" value={discoveryDate} />
          </dl>
        </section>

        <section className="panel" aria-labelledby="system-heading">
          <h2 id="system-heading">System</h2>
          {parent ? (
            <dl className="field-list">
              <Field
                label="Orbits"
                value={
                  <Link
                    to={`/body/${encodeURIComponent(
                      idFromRel(parent.rel) ?? parent.planet,
                    )}`}
                  >
                    {parent.planet}
                  </Link>
                }
              />
            </dl>
          ) : (
            <p className="panel-note">
              {data.bodyType === 'Moon'
                ? 'Orbits a body not listed in the catalog.'
                : 'Primary body — not orbiting another catalog object.'}
            </p>
          )}

          {moons.length > 0 && (
            <>
              <h3 className="subsection">
                Moons ({formatNumber(moons.length)})
              </h3>
              <div className="chip-list">
                {moons.map((m) => (
                  <Link
                    key={m.moon}
                    to={`/body/${encodeURIComponent(
                      idFromRel(m.rel) ?? m.moon,
                    )}`}
                    className="chip"
                  >
                    {m.moon}
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <p className="page-foot">
        API resource:{' '}
        <a href={data.rel} target="_blank" rel="noopener noreferrer">
          {data.rel}
        </a>
      </p>
    </div>
  );
}

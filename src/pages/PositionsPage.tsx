import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type PositionQuery } from '../lib/api';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/States';
import { formatNumber } from '../lib/format';

function localNow(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toApiDatetime(localValue: string): string {
  return localValue.length === 16 ? `${localValue}:00` : localValue;
}

export default function PositionsPage() {
  const [lat, setLat] = useState('40.4168');
  const [lon, setLon] = useState('-3.7038');
  const [elev, setElev] = useState('650');
  const [datetime, setDatetime] = useState(localNow());
  const [zone, setZone] = useState(
    String(-new Date().getTimezoneOffset() / 60),
  );
  const [locateError, setLocateError] = useState<string | null>(null);
  const [query, setQuery] = useState<PositionQuery | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['positions', query],
    queryFn: () => api.positions(query!),
    enabled: query !== null,
  });

  const errors = useMemo(() => {
    const list: string[] = [];
    const latN = Number(lat);
    const lonN = Number(lon);
    if (Number.isNaN(latN) || latN < -90 || latN > 90) {
      list.push('Latitude must be between -90 and 90.');
    }
    if (Number.isNaN(lonN) || lonN < -180 || lonN > 180) {
      list.push('Longitude must be between -180 and 180.');
    }
    if (Number.isNaN(Number(elev))) list.push('Elevation must be a number.');
    if (!datetime) list.push('Pick a date and time.');
    if (Number.isNaN(Number(zone))) list.push('Time zone must be a number.');
    return list;
  }, [lat, lon, elev, datetime, zone]);

  function locate() {
    setLocateError(null);
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        if (pos.coords.altitude !== null) {
          setElev(String(Math.round(pos.coords.altitude)));
        }
      },
      () => setLocateError('Could not get your location.'),
    );
  }

  function useNow() {
    setDatetime(localNow());
    setZone(String(-new Date().getTimezoneOffset() / 60));
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Sky positions</h1>
        <p>
          Where the Sun, the Moon, the planets and Pluto are in the sky
          right now — equatorial (RA/Dec) and horizontal (Az/Alt)
          coordinates for any observer.
        </p>
      </header>

      <form
        className="toolbar positions-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (errors.length === 0) {
            setQuery({
              lat: Number(lat),
              lon: Number(lon),
              elev: Number(elev),
              datetime: toApiDatetime(datetime),
              zone: Number(zone),
            });
          }
        }}
      >
        <label className="toolbar-field">
          <span>Latitude</span>
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </label>
        <label className="toolbar-field">
          <span>Longitude</span>
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
          />
        </label>
        <label className="toolbar-field">
          <span>Elevation (m)</span>
          <input
            type="number"
            step="any"
            value={elev}
            onChange={(e) => setElev(e.target.value)}
          />
        </label>
        <label className="toolbar-field">
          <span>Date &amp; time</span>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </label>
        <label className="toolbar-field">
          <span>UTC offset</span>
          <input
            type="number"
            step="any"
            min="-12"
            max="14"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            title="Time zone offset from UTC, e.g. 2 for CEST"
          />
        </label>
        <div className="toolbar-actions">
          <button type="submit" className="btn" disabled={errors.length > 0}>
            Calculate
          </button>
          <button type="button" className="btn btn-secondary" onClick={locate}>
            Use my location
          </button>
          <button type="button" className="btn btn-secondary" onClick={useNow}>
            Now
          </button>
        </div>
        {errors.length > 0 && (
          <ul className="form-errors">
            {errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}
        {locateError && <p className="form-error">{locateError}</p>}
      </form>

      {isLoading && <Skeleton lines={6} />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && (
        <>
          <section aria-labelledby="positions-heading">
            <h2 id="positions-heading">
              Positions for {data.location.latitude.toFixed(2)}°,{' '}
              {data.location.longitude.toFixed(2)}°
            </h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Object</th>
                    <th>Right ascension</th>
                    <th>Declination</th>
                    <th>Azimuth</th>
                    <th>Altitude</th>
                  </tr>
                </thead>
                <tbody>
                  {data.positions.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.ra}</td>
                      <td>{p.dec}</td>
                      <td>{p.az}</td>
                      <td>{p.alt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="panel-note">
              Negative altitude means the object is below the horizon.
            </p>
          </section>

          <section aria-labelledby="time-heading">
            <h2 id="time-heading">Time &amp; reference frames</h2>
            <dl className="field-list">
              <div className="field">
                <dt>Calculated for (UTC)</dt>
                <dd>{data.time_info.calculated_for_utc}</dd>
              </div>
              <div className="field">
                <dt>Local time</dt>
                <dd>{data.time_info.local_time_display}</dd>
              </div>
              <div className="field">
                <dt>Universal time</dt>
                <dd>{data.time_info.universal_time_ut}</dd>
              </div>
              <div className="field">
                <dt>Julian day</dt>
                <dd>{formatNumber(data.time_info.julian_day, 4)}</dd>
              </div>
              <div className="field">
                <dt>J2000 day number</dt>
                <dd>{formatNumber(data.time_info.day_number_j2000, 2)}</dd>
              </div>
              <div className="field">
                <dt>Greenwich sidereal time</dt>
                <dd>{data.time_info.greenwich_sidereal_time}</dd>
              </div>
              <div className="field">
                <dt>Local sidereal time</dt>
                <dd>{data.time_info.local_sidereal_time}</dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

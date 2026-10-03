import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type PositionQuery } from '../lib/api';
import { useI18n } from '../i18n';
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
  const { t } = useI18n();
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
      list.push(t('positions.errLat'));
    }
    if (Number.isNaN(lonN) || lonN < -180 || lonN > 180) {
      list.push(t('positions.errLon'));
    }
    if (Number.isNaN(Number(elev))) list.push(t('positions.errElev'));
    if (!datetime) list.push(t('positions.errDatetime'));
    if (Number.isNaN(Number(zone))) list.push(t('positions.errZone'));
    return list;
  }, [lat, lon, elev, datetime, zone, t]);

  function locate() {
    setLocateError(null);
    if (!navigator.geolocation) {
      setLocateError(t('positions.errGeolocationUnsupported'));
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
      () => setLocateError(t('positions.errGeolocation')),
    );
  }

  function useNow() {
    setDatetime(localNow());
    setZone(String(-new Date().getTimezoneOffset() / 60));
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t('positions.title')}</h1>
        <p>{t('positions.subtitle')}</p>
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
          <span>{t('positions.lat')}</span>
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
          <span>{t('positions.lon')}</span>
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
          <span>{t('positions.elev')}</span>
          <input
            type="number"
            step="any"
            value={elev}
            onChange={(e) => setElev(e.target.value)}
          />
        </label>
        <label className="toolbar-field">
          <span>{t('positions.datetime')}</span>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </label>
        <label className="toolbar-field">
          <span>{t('positions.zone')}</span>
          <input
            type="number"
            step="any"
            min="-12"
            max="14"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            title={t('positions.zoneTitle')}
          />
        </label>
        <div className="toolbar-actions">
          <button type="submit" className="btn" disabled={errors.length > 0}>
            {t('positions.calculate')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={locate}>
            {t('positions.useMyLocation')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={useNow}>
            {t('positions.now')}
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
              {t('positions.resultsFor', {
                lat: data.location.latitude.toFixed(2),
                lon: data.location.longitude.toFixed(2),
              })}
            </h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">{t('positions.col.object')}</th>
                    <th scope="col">{t('positions.col.ra')}</th>
                    <th scope="col">{t('positions.col.dec')}</th>
                    <th scope="col">{t('positions.col.az')}</th>
                    <th scope="col">{t('positions.col.alt')}</th>
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
            <p className="panel-note">{t('positions.belowHorizon')}</p>
          </section>

          <section aria-labelledby="time-heading">
            <h2 id="time-heading">{t('positions.timeHeading')}</h2>
            <dl className="field-list">
              <div className="field">
                <dt>{t('positions.calculatedFor')}</dt>
                <dd>{data.time_info.calculated_for_utc}</dd>
              </div>
              <div className="field">
                <dt>{t('positions.localTime')}</dt>
                <dd>{data.time_info.local_time_display}</dd>
              </div>
              <div className="field">
                <dt>{t('positions.universalTime')}</dt>
                <dd>{data.time_info.universal_time_ut}</dd>
              </div>
              <div className="field">
                <dt>{t('positions.julianDay')}</dt>
                <dd>{formatNumber(data.time_info.julian_day, 4)}</dd>
              </div>
              <div className="field">
                <dt>{t('positions.j2000')}</dt>
                <dd>{formatNumber(data.time_info.day_number_j2000, 2)}</dd>
              </div>
              <div className="field">
                <dt>{t('positions.gst')}</dt>
                <dd>{data.time_info.greenwich_sidereal_time}</dd>
              </div>
              <div className="field">
                <dt>{t('positions.lst')}</dt>
                <dd>{data.time_info.local_sidereal_time}</dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </div>
  );
}

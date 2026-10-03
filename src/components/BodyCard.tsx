import { Link } from 'react-router-dom';
import type { Body } from '../lib/model';
import { knownNumber } from '../lib/model';
import { formatNumber, formatTempShort } from '../lib/format';
import Badge from './Badge';

export default function BodyCard({ body }: { body: Body }) {
  const radius = knownNumber(body.meanRadius, 'meanRadius');
  const temp = knownNumber(body.avgTemp, 'avgTemp');

  return (
    <Link to={`/body/${encodeURIComponent(body.id)}`} className="body-card">
      <div className="body-card-header">
        <h3>{body.englishName || body.name}</h3>
        <Badge type={body.bodyType} />
      </div>
      <div className="body-card-meta">
        {radius !== null ? <span>{formatNumber(radius)} km</span> : null}
        {temp !== null ? <span>{formatTempShort(temp)}</span> : null}
      </div>
    </Link>
  );
}

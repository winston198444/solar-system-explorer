import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page">
      <div className="state-box state-empty">
        <span className="state-icon" aria-hidden="true">🛰️</span>
        <div>
          <strong>404 — Lost in space</strong>
          <p>That page does not exist in this galaxy.</p>
          <Link to="/" className="btn">
            Back to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

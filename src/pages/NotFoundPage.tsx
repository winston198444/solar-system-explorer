import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="page">
      <div className="state-box state-empty">
        <span className="state-icon" aria-hidden="true">🛰️</span>
        <div>
          <strong>{t('notfound.title')}</strong>
          <p>{t('notfound.text')}</p>
          <Link to="/" className="btn">
            {t('notfound.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}

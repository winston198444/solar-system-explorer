import type { ReactNode } from 'react';
import { useI18n } from '../i18n';

export default function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const { t } = useI18n();
  const message =
    error instanceof Error ? error.message : 'Something went wrong';
  return (
    <div className="state-box state-error" role="alert">
      <span className="state-icon" aria-hidden="true">⚠️</span>
      <div>
        <strong>{t('common.error')}</strong>
        <p>{message}</p>
        {onRetry ? (
          <button type="button" className="btn" onClick={onRetry}>
            {t('common.retry')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="state-box state-empty">
      <span className="state-icon" aria-hidden="true">🔭</span>
      <div>{children}</div>
    </div>
  );
}

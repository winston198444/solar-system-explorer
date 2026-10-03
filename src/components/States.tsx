import type { ReactNode } from 'react';

export default function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : 'Something went wrong';
  return (
    <div className="state-box state-error" role="alert">
      <span className="state-icon" aria-hidden="true">⚠️</span>
      <div>
        <strong>Failed to load data</strong>
        <p>{message}</p>
        {onRetry ? (
          <button type="button" className="btn" onClick={onRetry}>
            Retry
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

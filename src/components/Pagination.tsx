import { useI18n } from '../i18n';
import { formatNumber } from '../lib/format';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const { t } = useI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.min(total, (page - 1) * pageSize + 1);
  const end = Math.min(total, page * pageSize);

  const pages: (number | '…')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <nav className="pagination" aria-label={t('common.paginationNav')}>
      <span className="pagination-info">
        {total === 0
          ? t('common.zeroResults')
          : t('pagination.info', {
              start: formatNumber(start),
              end: formatNumber(end),
              total: formatNumber(total),
            })}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-small"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={t('common.prevPage')}
        >
          <span aria-hidden="true">←</span> {t('common.prev')}
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`btn btn-small${p === page ? ' btn-active' : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {formatNumber(p)}
            </button>
          ),
        )}
        <button
          type="button"
          className="btn btn-small"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label={t('common.nextPage')}
        >
          {t('common.next')} <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}

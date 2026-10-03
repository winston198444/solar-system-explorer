import { useI18n } from '../i18n';

export default function Skeleton({
  lines = 3,
}: {
  lines?: number;
}) {
  const { t } = useI18n();
  return (
    <div className="skeleton" role="status">
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton-line" />
      ))}
    </div>
  );
}

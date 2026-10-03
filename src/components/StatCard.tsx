import { useI18n } from '../i18n';

export default function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub ? (
        <span className="stat-sub">
          {t('common.updated')} {sub}
        </span>
      ) : null}
    </div>
  );
}

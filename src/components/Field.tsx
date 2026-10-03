import type { ReactNode } from 'react';

/**
 * A label/value row. Unknown values render as an em dash with a tooltip.
 */
export default function Field({
  label,
  value,
  title,
}: {
  label: string;
  value: ReactNode;
  title?: string;
}) {
  const unknown =
    value === null || value === undefined || value === '' || Number.isNaN(value as number);

  return (
    <div className="field">
      <dt>{label}</dt>
      {unknown ? (
        <dd className="field-unknown" title="Not available">
          —
        </dd>
      ) : (
        <dd title={title}>{value}</dd>
      )}
    </div>
  );
}

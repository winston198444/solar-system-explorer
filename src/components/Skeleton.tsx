export default function Skeleton({
  lines = 3,
}: {
  lines?: number;
}) {
  return (
    <div className="skeleton" role="status">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton-line" />
      ))}
    </div>
  );
}

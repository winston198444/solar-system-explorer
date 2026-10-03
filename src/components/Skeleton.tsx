export default function Skeleton({
  lines = 3,
}: {
  lines?: number;
}) {
  return (
    <div className="skeleton" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: `${Math.max(30, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}

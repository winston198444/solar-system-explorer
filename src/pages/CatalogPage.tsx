import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAllBodies } from '../lib/api';
import {
  BODY_TYPES,
  knownNumber,
  massKg,
  type Body,
  type BodyType,
} from '../lib/model';
import {
  formatNumber,
  formatPeriod,
  formatTempShort,
  toSuperscript,
} from '../lib/format';
import Skeleton from '../components/Skeleton';
import ErrorState, { EmptyState } from '../components/States';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

type SortKey = 'name' | 'meanRadius' | 'mass' | 'gravity' | 'avgTemp' | 'sideralOrbit';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'meanRadius', label: 'Radius' },
  { value: 'mass', label: 'Mass' },
  { value: 'gravity', label: 'Gravity' },
  { value: 'avgTemp', label: 'Temperature' },
  { value: 'sideralOrbit', label: 'Orbital period' },
];

function sortValue(body: Body, key: SortKey): number | string {
  switch (key) {
    case 'name':
      return (body.englishName || body.name).toLowerCase();
    case 'mass':
      return massKg(body);
    case 'gravity':
      return knownNumber(body.gravity, 'gravity') ?? -1;
    case 'avgTemp':
      return knownNumber(body.avgTemp, 'avgTemp') ?? Number.NEGATIVE_INFINITY;
    case 'sideralOrbit':
      return knownNumber(body.sideralOrbit, 'sideralOrbit') ?? -1;
    default:
      return knownNumber(body.meanRadius, 'meanRadius') ?? -1;
  }
}

interface MoonParent {
  id: string;
  name: string;
  type: string;
  count: number;
}

const PARENT_TYPE_ORDER = ['Planet', 'Dwarf Planet', 'Asteroid'];

function BodiesTable({
  bodies,
  sortKey,
  sortDir,
  onSort,
}: {
  bodies: Body[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>
              <button
                type="button"
                className="th-sort"
                onClick={() => onSort('meanRadius')}
              >
                Radius {sortKey === 'meanRadius' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </th>
            <th>
              <button
                type="button"
                className="th-sort"
                onClick={() => onSort('mass')}
              >
                Mass {sortKey === 'mass' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </th>
            <th>
              <button
                type="button"
                className="th-sort"
                onClick={() => onSort('gravity')}
              >
                Gravity {sortKey === 'gravity' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </th>
            <th>
              <button
                type="button"
                className="th-sort"
                onClick={() => onSort('avgTemp')}
              >
                Temp {sortKey === 'avgTemp' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </th>
            <th>
              <button
                type="button"
                className="th-sort"
                onClick={() => onSort('sideralOrbit')}
              >
                Period {sortKey === 'sideralOrbit' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {bodies.map((b) => {
            const radius = knownNumber(b.meanRadius, 'meanRadius');
            const temp = knownNumber(b.avgTemp, 'avgTemp');
            const gravity = knownNumber(b.gravity, 'gravity');
            const period = knownNumber(b.sideralOrbit, 'sideralOrbit');
            return (
              <tr key={b.id}>
                <td>
                  <Link to={`/body/${encodeURIComponent(b.id)}`}>
                    {b.englishName || b.name}
                  </Link>
                  {b.name !== b.englishName ? (
                    <small className="cell-sub">{b.name}</small>
                  ) : null}
                </td>
                <td>
                  <Badge type={b.bodyType} />
                </td>
                <td>{radius !== null ? `${formatNumber(radius)} km` : '—'}</td>
                <td>
                  {b.mass
                    ? `${b.mass.massValue.toFixed(2)} × 10${toSuperscript(b.mass.massExponent)} kg`
                    : '—'}
                </td>
                <td>{gravity !== null ? `${gravity.toFixed(2)} m/s²` : '—'}</td>
                <td>{temp !== null ? formatTempShort(temp) : '—'}</td>
                <td>{period !== null ? formatPeriod(period) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') as BodyType | null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['bodies'],
    queryFn: fetchAllBodies,
  });

  const [search, setSearch] = useState('');
  const [type, setType] = useState<BodyType | 'All'>(initialType ?? 'All');
  const [parent, setParent] = useState<string>('All');
  const [groupByParent, setGroupByParent] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bodies that are orbited by moons, with moon counts.
  const moonParents = useMemo<MoonParent[]>(() => {
    if (!data) return [];
    const map = new Map<string, MoonParent>();
    for (const b of data) {
      if (b.bodyType !== 'Moon' || !b.aroundPlanet) continue;
      const pid = b.aroundPlanet.planet;
      const existing = map.get(pid);
      if (existing) {
        existing.count += 1;
        continue;
      }
      const parentBody = data.find((p) => p.id === pid);
      map.set(pid, {
        id: pid,
        name: parentBody?.englishName || pid,
        type: parentBody?.bodyType || 'Unknown',
        count: 1,
      });
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [data]);

  const parentInfo = useMemo(() => {
    if (!data) return new Map<string, MoonParent>();
    const map = new Map<string, MoonParent>();
    for (const p of moonParents) map.set(p.id, p);
    return map;
  }, [data, moonParents]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((b) => {
      if (type !== 'All' && b.bodyType !== type) return false;
      if (
        type === 'Moon' &&
        parent !== 'All' &&
        (!b.aroundPlanet || b.aroundPlanet.planet !== parent)
      )
        return false;
      if (
        q &&
        !(
          b.name.toLowerCase().includes(q) ||
          (b.englishName ?? '').toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [data, search, type, parent]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      const cmp =
        typeof va === 'string'
          ? va.localeCompare(vb as string)
          : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // Moons grouped by the body they orbit.
  const groups = useMemo(() => {
    if (type !== 'Moon' || !groupByParent) return [];
    const map = new Map<string, Body[]>();
    for (const b of sorted) {
      const pid = b.aroundPlanet?.planet ?? 'unknown';
      const list = map.get(pid);
      if (list) list.push(b);
      else map.set(pid, [b]);
    }
    return [...map.entries()].sort((a, b) => {
      const nameA = parentInfo.get(a[0])?.name ?? a[0];
      const nameB = parentInfo.get(b[0])?.name ?? b[0];
      return nameA.localeCompare(nameB);
    });
  }, [sorted, type, groupByParent, parentInfo]);

  function changeSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const showMoonControls = type === 'Moon';
  const grouped = showMoonControls && groupByParent;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Catalog</h1>
        <p>
          Every object in the API — filter, search, sort and group
          the full list.
        </p>
      </header>

      {isLoading && <Skeleton lines={6} />}
      {error && <ErrorState error={error} />}

      {data && (
        <>
          <div className="toolbar">
            <label className="toolbar-field">
              <span>Search</span>
              <input
                type="search"
                value={search}
                placeholder="Name…"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="toolbar-field">
              <span>Type</span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as BodyType | 'All');
                  setParent('All');
                  setPage(1);
                }}
              >
                <option value="All">All types</option>
                {BODY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            {showMoonControls && (
              <>
                <label className="toolbar-field">
                  <span>Orbits</span>
                  <select
                    value={parent}
                    onChange={(e) => {
                      setParent(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="All">All parent bodies</option>
                    {PARENT_TYPE_ORDER.map((parentType) => {
                      const ofType = moonParents.filter(
                        (p) => p.type === parentType,
                      );
                      if (ofType.length === 0) return null;
                      return (
                        <optgroup
                          key={parentType}
                          label={
                            parentType === 'Asteroid'
                              ? 'Asteroids'
                              : `${parentType}s`
                          }
                        >
                          {ofType.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.count})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </label>
                <label className="toolbar-field toolbar-check">
                  <input
                    type="checkbox"
                    checked={groupByParent}
                    onChange={(e) => setGroupByParent(e.target.checked)}
                  />
                  <span>Group by planet</span>
                </label>
              </>
            )}

            <label className="toolbar-field">
              <span>Sort by</span>
              <select
                value={sortKey}
                onChange={(e) => changeSort(e.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDir === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
            <label className="toolbar-field">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>

          {total === 0 ? (
            <EmptyState>
              <strong>No objects match your filters.</strong>
              <p>Try a different search term or type.</p>
            </EmptyState>
          ) : grouped ? (
            groups.map(([pid, moons]) => {
              const info = parentInfo.get(pid);
              return (
                <section
                  key={pid}
                  className="moon-group"
                  aria-labelledby={`group-${pid}`}
                >
                  <h2 id={`group-${pid}`} className="group-header">
                    <Link to={`/body/${encodeURIComponent(pid)}`}>
                      {info?.name ?? pid}
                    </Link>
                    {info ? <Badge type={info.type} /> : null}
                    <span className="group-count">
                      {formatNumber(moons.length)}{' '}
                      {moons.length === 1 ? 'moon' : 'moons'}
                    </span>
                  </h2>
                  <BodiesTable
                    bodies={moons}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={changeSort}
                  />
                </section>
              );
            })
          ) : (
            <>
              <BodiesTable
                bodies={pageItems}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={changeSort}
              />
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}

      <p className="page-foot">
        Tip: negative rotation values are retrograde. Distances are in
        km; temperatures are stored in Kelvin and shown in °C.
      </p>
    </div>
  );
}

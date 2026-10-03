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
import { useI18n, type DictKey } from '../i18n';
import Skeleton from '../components/Skeleton';
import ErrorState, { EmptyState } from '../components/States';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';

type SortKey = 'name' | 'meanRadius' | 'mass' | 'gravity' | 'avgTemp' | 'sideralOrbit';

const SORT_OPTIONS: { value: SortKey; labelKey: DictKey }[] = [
  { value: 'name', labelKey: 'sort.name' },
  { value: 'meanRadius', labelKey: 'sort.radius' },
  { value: 'mass', labelKey: 'sort.mass' },
  { value: 'gravity', labelKey: 'sort.gravity' },
  { value: 'avgTemp', labelKey: 'sort.temp' },
  { value: 'sideralOrbit', labelKey: 'sort.period' },
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

function SortableTh({
  id,
  labelKey,
  sortKey,
  sortDir,
  onSort,
}: {
  id: SortKey;
  labelKey: DictKey;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const { t } = useI18n();
  const active = sortKey === id;
  const ariaDir = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
  const label = t(labelKey);
  return (
    <th scope="col" aria-sort={ariaDir}>
      <button
        type="button"
        className="th-sort"
        onClick={() => onSort(id)}
        aria-label={
          active
            ? `${t('sort.aria', { label })} (${
                sortDir === 'asc' ? t('sort.asc') : t('sort.desc')
              })`
            : t('sort.aria', { label })
        }
      >
        {label}{' '}
        <span aria-hidden="true">
          {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </span>
      </button>
    </th>
  );
}

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
  const { t } = useI18n();
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{t('col.name')}</th>
            <th scope="col">{t('col.type')}</th>
            <SortableTh
              id="meanRadius"
              labelKey="col.radius"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              id="mass"
              labelKey="col.mass"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              id="gravity"
              labelKey="col.gravity"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              id="avgTemp"
              labelKey="col.temp"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
            <SortableTh
              id="sideralOrbit"
              labelKey="col.period"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
            />
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
  const { t, typeLabel } = useI18n();
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
        <h1>{t('catalog.title')}</h1>
        <p>{t('catalog.subtitle')}</p>
      </header>

      {isLoading && <Skeleton lines={6} />}
      {error && <ErrorState error={error} />}

      {data && (
        <>
          <div className="toolbar">
            <label className="toolbar-field">
              <span>{t('catalog.search')}</span>
              <input
                type="search"
                value={search}
                placeholder={t('catalog.searchPlaceholder')}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="toolbar-field">
              <span>{t('catalog.type')}</span>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as BodyType | 'All');
                  setParent('All');
                  setPage(1);
                }}
              >
                <option value="All">{t('catalog.allTypes')}</option>
                {BODY_TYPES.map((t2) => (
                  <option key={t2} value={t2}>
                    {typeLabel(t2)}
                  </option>
                ))}
              </select>
            </label>

            {showMoonControls && (
              <>
                <label className="toolbar-field">
                  <span>{t('catalog.orbits')}</span>
                  <select
                    value={parent}
                    onChange={(e) => {
                      setParent(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="All">{t('catalog.allParents')}</option>
                    {PARENT_TYPE_ORDER.map((parentType) => {
                      const ofType = moonParents.filter(
                        (p) => p.type === parentType,
                      );
                      if (ofType.length === 0) return null;
                      return (
                        <optgroup
                          key={parentType}
                          label={t(
                            `catalog.parentGroup.${parentType}` as DictKey,
                          )}
                        >
                          {ofType.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({formatNumber(p.count)})
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
                  <span>{t('catalog.groupByPlanet')}</span>
                </label>
              </>
            )}

            <label className="toolbar-field">
              <span>{t('catalog.sortBy')}</span>
              <select
                value={sortKey}
                onChange={(e) => changeSort(e.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDir === 'asc'
                ? `↑ ${t('catalog.ascending')}`
                : `↓ ${t('catalog.descending')}`}
            </button>
            <label className="toolbar-field">
              <span>{t('catalog.rows')}</span>
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
              <strong>{t('catalog.noMatch')}</strong>
              <p>{t('catalog.noMatchHint')}</p>
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
                      {moons.length === 1
                        ? t('catalog.moon.one')
                        : t('catalog.moon.other')}
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
    </div>
  );
}

import { useState } from 'react';
import Panel from '../../components/admin/Panel';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import Button from '../../components/common/Button';
import useApi from '../../hooks/useApi';

const LIMIT = 10;

/** One paginated table backed by a real admin API endpoint. */
export default function ManagedList({ title, loader, columns, emptyTitle, emptyText, filters }) {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(filters?.[0]?.value);
  const { data, loading, error, reload } = useApi(() => loader(page, LIMIT, filter), [page, filter]);
  const cols = typeof columns === 'function' ? columns(reload) : columns;
  const tabs = filters && (
    <div role="group" aria-label="Filter by approval" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {filters.map((f) => (
        <Button key={f.label} size="sm" variant={filter === f.value ? 'primary' : 'secondary'} aria-pressed={filter === f.value} onClick={() => { setPage(1); setFilter(f.value); }}>{f.label}</Button>
      ))}
    </div>
  );
  return (
    <Panel title={title} flush action={tabs} id={`list-${title.replace(/\W+/g, '-').toLowerCase()}`}>
      <DataTable caption={title} columns={cols} rows={data?.items} loading={loading} error={error} onRetry={reload} emptyTitle={emptyTitle} emptyText={emptyText} />
      {data && !error && <Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} disabled={loading} />}
    </Panel>
  );
}

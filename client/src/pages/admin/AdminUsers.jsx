import { useState } from 'react';
import Panel from '../../components/admin/Panel';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import Button from '../../components/common/Button';
import useApi from '../../hooks/useApi';
import { adminApi } from '../../services/adminApi';
import { formatNumber } from '../../utils/format';
import { userColumns } from './columns';
import adm from '../../components/admin/admin.module.css';

const LIMIT = 10;
const FILTERS = [{ label: 'All', value: undefined }, { label: 'Verified', value: 'true' }, { label: 'Unverified', value: 'false' }];

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [verified, setVerified] = useState();
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, error, reload } = useApi(() => adminApi.users(page, LIMIT, verified, q || undefined), [page, verified, q]);

  const tools = (
    <div className={adm.toolbar}>
      <form role="search" className={adm.toolbar} onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(input.trim()); }}>
        <label className="visually-hidden" htmlFor="user-q">Search users by name, email or phone</label>
        <input id="user-q" type="search" className={adm.input} style={{ width: 220 }} value={input} onChange={(e) => setInput(e.target.value)} maxLength={80} placeholder="Name, email or phone" />
        <Button type="submit" size="sm">Search</Button>
        {q && <Button type="button" size="sm" variant="secondary" onClick={() => { setInput(''); setQ(''); setPage(1); }}>Clear</Button>}
      </form>
      <div className={adm.chips} role="group" aria-label="Filter by email verification">
        {FILTERS.map((f) => (
          <button key={f.label} type="button" className={`${adm.chip} ${verified === f.value ? adm.chipOn : ''}`} aria-pressed={verified === f.value} onClick={() => { setPage(1); setVerified(f.value); }}>{f.label}</button>
        ))}
      </div>
    </div>
  );

  return (
    <Panel title={`Registered users${data ? ` · ${formatNumber(data.total)}` : ''}`} id="list-users" flush action={tools}>
      <DataTable
        caption="Registered users" columns={userColumns()} rows={data?.items} loading={loading} error={error} onRetry={reload}
        emptyTitle={q ? 'No users match your search' : 'No users here'}
        emptyText={q ? 'Try a different name, email or phone number.' : 'Users appear here as soon as they create an account. No approval is needed.'}
      />
      {data && !error && <Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} disabled={loading} />}
    </Panel>
  );
}
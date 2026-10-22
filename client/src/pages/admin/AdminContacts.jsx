import { useState } from 'react';
import { Link } from 'react-router-dom';
import Panel from '../../components/admin/Panel';
import Badge from '../../components/admin/Badge';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import Button from '../../components/common/Button';
import useApi from '../../hooks/useApi';
import { adminApi } from '../../services/adminApi';
import { formatDateTime, formatNumber } from '../../utils/format';
import { STATUS_LABEL, STATUS_TONE } from './contactMeta';
import adm from '../../components/admin/admin.module.css';
import tableStyles from '../../components/admin/DataTable.module.css';
import styles from './AdminContacts.module.css';

const LIMIT = 10;
const TABS = [['', 'All', 'total'], ['OPEN', 'Open', 'open'], ['IN_PROGRESS', 'In progress', 'inProgress'], ['RESOLVED', 'Resolved', 'resolved']];

const columns = [
    { key: 'ticket', header: 'Ticket', nowrap: true, render: (r) => <Link className={styles.ticket} to={`/admin/contacts/${r.id}`}>{r.ticketId}</Link> },
    { key: 'from', header: 'Sender', render: (r) => <>{r.name}<span className={tableStyles.sub}>{r.email}</span></> },
    { key: 'subject', header: 'Subject', render: (r) => <>{r.subject}<span className={tableStyles.sub}>{r.preview}{r.preview.length >= 120 ? '…' : ''}</span></> },
    { key: 'when', header: 'Submitted', nowrap: true, render: (r) => formatDateTime(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge> },
    { key: 'upd', header: 'Updated', nowrap: true, render: (r) => formatDateTime(r.updatedAt) },
    { key: 'go', header: 'Action', render: (r) => <Link to={`/admin/contacts/${r.id}`}>Open</Link> },
];

export default function AdminContacts() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [input, setInput] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const { data, loading, error, reload } = useApi(
        () => adminApi.contacts({ page, limit: LIMIT, status: status || undefined, q: q || undefined, from: from || undefined, to: to || undefined }),
        [page, status, q, from, to],
    );
    const counts = data?.counts;
    const filtered = Boolean(q || from || to || status);

    const tools = (
        <div className={adm.toolbar}>
            <form role="search" className={adm.toolbar} onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(input.trim()); }}>
                <label className="visually-hidden" htmlFor="cq">Search by sender, email, ticket or subject</label>
                <input id="cq" type="search" className={adm.input} style={{ width: 230 }} value={input} onChange={(e) => setInput(e.target.value)} maxLength={80} placeholder="Sender, email, ticket, subject" />
                <Button type="submit" size="sm">Search</Button>
            </form>
            <label className="visually-hidden" htmlFor="cf">From date</label>
            <input id="cf" type="date" className={adm.input} value={from} max={to || undefined} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
            <label className="visually-hidden" htmlFor="ct">To date</label>
            <input id="ct" type="date" className={adm.input} value={to} min={from || undefined} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
            {filtered && <Button size="sm" variant="secondary" onClick={() => { setStatus(''); setQ(''); setInput(''); setFrom(''); setTo(''); setPage(1); }}>Clear</Button>}
        </div>
    );

    return (
        <>
            <div className={adm.chips} role="group" aria-label="Filter by status">
                {TABS.map(([value, label, key]) => (
                    <button key={label} type="button" className={`${adm.chip} ${status === value ? adm.chipOn : ''}`} aria-pressed={status === value} onClick={() => { setPage(1); setStatus(value); }}>
                        {label}{counts ? ` (${formatNumber(counts[key])})` : ''}
                    </button>
                ))}
            </div>
            <Panel title="Contact queries" id="contact-queries" flush action={tools}>
                <DataTable
                    caption="Contact queries" columns={columns} rows={data?.items} loading={loading} error={error} onRetry={reload}
                    emptyTitle={filtered ? 'No queries match these filters' : 'No queries yet'}
                    emptyText={filtered ? 'Try a different search, status or date range.' : 'Messages sent from the public Contact page appear here.'}
                />
                {data && !error && <Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} disabled={loading} />}
            </Panel>
        </>
    );
}
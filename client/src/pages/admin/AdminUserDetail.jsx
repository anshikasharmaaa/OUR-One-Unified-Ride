import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Panel from '../../components/admin/Panel';
import Badge from '../../components/admin/Badge';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import StateMessage from '../../components/admin/StateMessage';
import Button from '../../components/common/Button';
import useApi from '../../hooks/useApi';
import { adminApi } from '../../services/adminApi';
import { formatDateTime, VEHICLE_SHORT } from '../../utils/format';
import { fareText, SOURCE_LABEL } from '../../utils/rideFormat';
import { EVENT_LABEL, EVENT_TONE, PROVIDER_NAME, RIDE_FILTERS } from '../../utils/rideEvents';
import tableStyles from '../../components/admin/DataTable.module.css';
import styles from './AdminUserDetail.module.css';

const LIMIT = 10;

const columns = [
    { key: 'when', header: 'When', nowrap: true, render: (r) => formatDateTime(r.createdAt) },
    { key: 'type', header: 'Event', render: (r) => <Badge tone={EVENT_TONE[r.type]}>{EVENT_LABEL[r.type]}</Badge> },
    { key: 'route', header: 'Pickup → Drop-off', render: (r) => <>{r.pickup || '—'}<span className={tableStyles.sub}>→ {r.dropoff || '—'}</span></> },
    { key: 'prov', header: 'Provider / category', render: (r) => <>{r.provider ? PROVIDER_NAME[r.provider] : '—'}<span className={tableStyles.sub}>{r.vehicleType ? (VEHICLE_SHORT[r.vehicleType.toUpperCase()] || r.vehicleType) : ''}</span></> },
    { key: 'fare', header: 'Fare (estimate)', render: (r) => (r.fare ? <>{fareText(r.fare)}<span className={tableStyles.sub}>{SOURCE_LABEL[r.fareSource] || r.fareSource}</span></> : '—') },
    { key: 'ref', header: 'Reference', render: (r) => r.reference || '—' },
];

export default function AdminUserDetail() {
    const { id } = useParams();
    const [page, setPage] = useState(1);
    const [type, setType] = useState();
    const detail = useApi(() => adminApi.userDetail(id), [id]);
    const rides = useApi(() => adminApi.userRides(id, page, LIMIT, type), [id, page, type]);
    const u = detail.data?.user;

    return (
        <>
            <Helmet><title>{u ? `${u.name} · Users` : 'User'} · OUR Admin</title></Helmet>
            <p><Link to="/admin/users">← All users</Link></p>

            <Panel title={u ? u.name : 'User'} id="user-detail">
                {detail.loading && <StateMessage title="Loading user…" />}
                {detail.error && <StateMessage kind="error" title="Couldn’t load this user" onRetry={detail.reload}>{detail.error}</StateMessage>}
                {u && (
                    <dl className={styles.dl}>
                        <div><dt>Email</dt><dd>{u.email} <Badge tone={u.emailVerified ? 'good' : 'warn'}>{u.emailVerified ? 'Verified' : 'Unverified'}</Badge></dd></div>
                        <div><dt>Phone</dt><dd>{u.phone ? `+91 ${u.phone}` : 'Not added'}</dd></div>
                        <div><dt>Member since</dt><dd>{formatDateTime(u.createdAt)}</dd></div>
                        <div><dt>Account</dt><dd>{u.status === 'SUSPENDED' ? 'Suspended' : 'Active'}</dd></div>
                        <div><dt>Sign-in</dt><dd>{u.signInMethods.join(' + ') || '—'}</dd></div>
                        <div><dt>Ride events</dt><dd>{detail.data.counts.total}</dd></div>
                        <div><dt>Referral code</dt><dd>{u.referralCode || 'Not generated yet'}</dd></div>
                        <div><dt>Referred by</dt><dd>{detail.data.referral.referredBy ? `${detail.data.referral.referredBy.name} (${detail.data.referral.referredBy.status.toLowerCase()})` : 'Nobody'}</dd></div>
                    </dl>
                )}
                {u && <p className={styles.note}>Opening this page is recorded in the audit log. Ride history is read-only.</p>}
            </Panel>

            {u && (
                <Panel title="Referrals made" id="user-referrals" flush>
                    <DataTable
                        caption="Referrals made by this user" compact
                        columns={[
                            { key: 'n', header: 'Referred user', render: (r) => r.name },
                            { key: 's', header: 'Status', render: (r) => <Badge tone={r.status === 'QUALIFIED' ? 'good' : 'warn'}>{r.status === 'QUALIFIED' ? 'Qualified' : 'Pending'}</Badge> },
                            { key: 'c', header: 'Joined', render: (r) => formatDateTime(r.createdAt) },
                            { key: 'q', header: 'Qualified', render: (r) => (r.qualifiedAt ? formatDateTime(r.qualifiedAt) : '—') },
                        ]}
                        rows={detail.data.referral.referred} emptyTitle="No referrals" emptyText="Nobody has used this user’s code yet."
                    />
                </Panel>
            )}

            <Panel
                title="Ride history" id="user-history" flush
                action={
                    <div role="group" aria-label="Filter ride history" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {RIDE_FILTERS.map((f) => (
                            <Button key={f.label} size="sm" variant={type === f.value ? 'primary' : 'secondary'} aria-pressed={type === f.value} onClick={() => { setPage(1); setType(f.value); }}>{f.label}</Button>
                        ))}
                    </div>
                }
            >
                <DataTable caption="Ride history" columns={columns} rows={rides.data?.items} loading={rides.loading} error={rides.error} onRetry={rides.reload} emptyTitle="No ride activity" emptyText="This user hasn’t compared or booked any rides yet." />
                {rides.data && !rides.error && <Pagination page={page} limit={LIMIT} total={rides.data.total} onPage={setPage} disabled={rides.loading} />}
            </Panel>
        </>
    );
}
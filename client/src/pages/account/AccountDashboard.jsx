import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Panel from '../../components/admin/Panel';
import DataTable from '../../components/admin/DataTable';
import Alert from '../../components/common/Alert';
import Icon from '../../components/common/Icon';
import SearchPanel from '../../components/home/SearchPanel';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { searchService } from '../../services/searchService';
import { formatDateTime, formatNumber, VEHICLE_SHORT } from '../../utils/format';
import { VEHICLE_OPTIONS } from '../../config/site';
import { mySearchColumns } from './accountColumns';
import styles from './Account.module.css';

export default function AccountDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const recent = useApi(() => searchService.mine(1, 5));
  const first = user.name.split(' ')[0];
  const last = recent.data?.items?.[0];

  return (
    <div className={styles.stack}>
      <Helmet><title>Dashboard · OUR</title></Helmet>
      <section className={styles.welcome} aria-labelledby="welcome-h">
        <div>
          <h2 id="welcome-h">Welcome back, {first}</h2>
          <p>Plan a trip, revisit your recent searches and manage your account from one place.</p>
        </div>
        <span className={styles.pill}><Icon name="check" size={16} />Verified account</span>
      </section>

      <div className={styles.tiles}>
        <div className={styles.tile}>
          <span>Searches made</span>
          <strong>{recent.loading ? '…' : recent.error ? '—' : formatNumber(recent.data?.total)}</strong>
          <small>Kept for 180 days</small>
        </div>
        <div className={styles.tile}>
          <span>Last search</span>
          <strong>{recent.loading ? '…' : last ? `${last.pickup} → ${last.dropoff}` : 'None yet'}</strong>
          <small>{last ? `${VEHICLE_SHORT[last.vehicleType]} · ${formatDateTime(last.createdAt)}` : 'Your first search will show up here'}</small>
        </div>
        <div className={styles.tile}>
          <span>Signed in as</span>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
      </div>

      <div className={styles.two}>
        <Panel title="Plan a trip" id="plan-trip">
          <p className={styles.muted}>Enter your pickup and drop-off, then choose a ride type on the next screen.</p>
          <SearchPanel idPrefix="dash" onSubmitted={(result, values) => navigate('/account/search', { state: { submitted: { ...values, result } } })} />
        </Panel>
        <div className={styles.stack}>
          <Panel title="Browse by ride type" id="ride-types">
            <div className={styles.chips}>
              {VEHICLE_OPTIONS.filter((o) => o.value !== 'ANY').map((o) => (
                <Link key={o.value} className={styles.chip} to={`/account/search?vehicle=${o.value}`}>{o.label}</Link>
              ))}
            </div>
          </Panel>
          <Alert variant="info">Live fare comparison across providers is still in development, so no fares are shown — and none are made up.</Alert>
        </div>
      </div>

      <Panel title="Recent searches" id="recent-searches" flush action={<Link to="/account/history">View all</Link>}>
        <DataTable caption="Your most recent searches" columns={mySearchColumns} rows={recent.data?.items} loading={recent.loading} error={recent.error} onRetry={recent.reload} emptyTitle="No searches yet" emptyText="Searches you make while signed in will appear here." skeletonRows={3} />
      </Panel>
    </div>
  );
}

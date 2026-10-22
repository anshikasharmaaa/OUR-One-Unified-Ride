import { Link } from 'react-router-dom';
import Panel from '../../components/admin/Panel';
import StatCard from '../../components/admin/StatCard';
import StateMessage from '../../components/admin/StateMessage';
import useApi from '../../hooks/useApi';
import { adminApi } from '../../services/adminApi';
import { formatNumber } from '../../utils/format';

const grid = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' };

export default function AdminComparisons() {
  const { data, loading, error, reload } = useApi(() => adminApi.stats());
  const c = data?.comparisons;
  const off = Boolean(data) && !c?.available;

  return (
    <Panel title="Comparison activity" id="comparisons">
      {error && <StateMessage kind="error" title="Couldn’t load comparison activity" onRetry={reload}>{error}</StateMessage>}
      {!error && (
        <>
          <div style={grid}>
            <StatCard icon="activity" label="All time" value={c?.total} unavailable={off} hint="Fare comparisons recorded" loading={loading} />
            <StatCard icon="clock" label="Last 7 days" value={c?.last7Days} unavailable={off} hint={data && `${formatNumber(data.searches.last7Days)} searches submitted`} loading={loading} />
            <StatCard icon="search" label="Last 24 hours" value={c?.last24Hours} unavailable={off} hint="Fare comparisons recorded" loading={loading} />
          </div>
          <p style={{ marginTop: 16 }}>
            These count comparisons that signed-in riders ran and that were saved to ride history. They say nothing about fares, providers or bookings.
            Open a user under <Link to="/admin/users">Users</Link> to see their individual history, or view <Link to="/admin/searches">ride searches</Link>.
          </p>
        </>
      )}
    </Panel>
  );
}
import { useState } from 'react';
import Panel from '../../components/admin/Panel';
import BarChart from '../../components/admin/BarChart';
import StateMessage from '../../components/admin/StateMessage';
import Button from '../../components/common/Button';
import useApi from '../../hooks/useApi';
import { adminApi } from '../../services/adminApi';
import styles from '../../components/admin/admin.module.css';

const RANGES = [7, 14, 30];
const CHARTS = [['users', 'New user accounts per day'], ['searches', 'Ride searches per day']];

export default function AdminAnalytics() {
  const [days, setDays] = useState(14);
  const { data, loading, error, reload } = useApi(() => adminApi.analytics(days), [days]);
  return (
    <>
      <Panel title="Reports" id="range" action={
        <div role="group" aria-label="Date range" style={{ display: 'flex', gap: 8 }}>
          {RANGES.map((r) => <Button key={r} size="sm" variant={r === days ? 'primary' : 'secondary'} aria-pressed={r === days} onClick={() => setDays(r)}>{r} days</Button>)}
        </div>
      }>
        <p className={styles.statHint}>Real counts from the database, grouped by day in India Standard Time.</p>
      </Panel>
      {error && <Panel><StateMessage kind="error" title="Couldn’t load analytics" onRetry={reload}>{error}</StateMessage></Panel>}
      {loading && !data && <Panel><StateMessage title="Loading analytics…" /></Panel>}
      {data && (
        <div className={styles.grid2} aria-busy={loading || undefined}>
          {CHARTS.map(([key, label]) => (
            <Panel key={key} title={label} id={`chart-${key}`}><BarChart days={data.days} values={data[key]} label={label} /></Panel>
          ))}
        </div>
      )}
    </>
  );
}
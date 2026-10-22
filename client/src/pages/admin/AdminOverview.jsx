import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/admin/StatCard';
import Panel from '../../components/admin/Panel';
import Badge from '../../components/admin/Badge';
import StateMessage from '../../components/admin/StateMessage';
import { TrendChart, DonutChart, ValueBars, COLORS } from '../../components/admin/charts';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/adminApi';
import { formatNumber, formatDateTime } from '../../utils/format';
import adm from '../../components/admin/admin.module.css';
import styles from './AdminOverview.module.css';

const DOT = { user: '#3b5bdb', comparison: '#22b8cf', redirect: '#f59f00', query: '#12b886' };

function uptimeLabel(seconds) {
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`;
  return `${Math.floor(seconds / 86400)} d ${Math.floor((seconds % 86400) / 3600)} h`;
}

const Art = () => (
  <svg className={styles.art} viewBox="0 0 220 150" role="img" aria-label="Dashboard illustration">
    <rect x="28" y="22" width="120" height="82" rx="10" fill="#e8edff" />
    <rect x="38" y="32" width="100" height="62" rx="6" fill="#fff" />
    {[0, 1, 2, 3].map((i) => <rect key={i} x={48 + i * 22} y={84 - (14 + i * 9)} width="12" height={14 + i * 9} rx="3" fill={i === 3 ? '#3b5bdb' : '#c9d3fb'} />)}
    <rect x="80" y="104" width="16" height="14" fill="#c9d3fb" />
    <rect x="60" y="116" width="56" height="7" rx="3.5" fill="#c9d3fb" />
    <circle cx="176" cy="48" r="17" fill="#ffd8a8" />
    <path d="M154 108c0-19 10-30 22-30s22 11 22 30z" fill="#3b5bdb" />
    <circle cx="176" cy="44" r="8" fill="#fff3e0" />
    <path d="M160 120h50" stroke="#c9d3fb" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function AdminOverview() {
  const { user } = useAuth();
  const [days, setDays] = useState(14);
  const ov = useApi(() => adminApi.overview(days), [days]);
  const health = useApi(() => adminApi.health());
  const d = ov.data;
  const t = d?.totals;
  const first = user.name.trim().split(/\s+/)[0];
  const common = { loading: ov.loading && !d, error: Boolean(ov.error) };

  const providerBars = (d?.providerSelections ?? []).map((p) => ({ label: p.name, value: p.count }));

  return (
    <>
      <div className={styles.bar}>
        <label htmlFor="period">Period</label>
        <select id="period" className={adm.select} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Reporting period">
          {[7, 14, 30].map((n) => <option key={n} value={n}>Last {n} days</option>)}
        </select>
      </div>

      {ov.error && !d && <Panel><StateMessage kind="error" title="Couldn’t load the overview" onRetry={ov.reload}>{ov.error}</StateMessage></Panel>}

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.hero} aria-label="Summary">
            <div>
              <h2>Hello {first}!</h2>
              {t ? (
                <p>
                  You have {formatNumber(t.queries.open)} open contact {t.queries.open === 1 ? 'query' : 'queries'} and {formatNumber(t.users.inRange)} new {t.users.inRange === 1 ? 'user' : 'users'} in the last {days} days.
                </p>
              ) : <p><span className={adm.skeleton} style={{ display: 'block', width: 260, height: 14 }} /></p>}
              <Link to="/admin/contacts">Review queries →</Link>
            </div>
            <Art />
          </section>

          <div className={adm.grid3}>
            <StatCard icon="users" label="Registered users" value={t?.users.total} delta={t?.users.change} hint={t && `${formatNumber(t.users.inRange)} joined in this period`} {...common} />
            <StatCard icon="activity" label="Fare comparisons" value={t?.comparisons.total} delta={t?.comparisons.change} hint={t && `${formatNumber(t.comparisons.inRange)} in this period`} {...common} />
            <StatCard icon="external" label="Provider redirects" value={t?.redirects.total} delta={t?.redirects.change} hint={t && `${formatNumber(t.redirects.inRange)} in this period · not bookings`} {...common} />
            <StatCard icon="mail" label="Contact queries" value={t?.queries.total} delta={t?.queries.change} hint={t && `${formatNumber(t.queries.open)} open · ${formatNumber(t.queries.resolved)} resolved`} {...common} />
            <StatCard icon="clock" label="Awaiting a reply" value={t && t.queries.open + t.queries.inProgress} hint={t && `${formatNumber(t.queries.inProgress)} in progress`} {...common} />
            <StatCard icon="car" label="Providers listed" value={t?.providers.total} hint={t && `${formatNumber(t.providers.active)} active`} {...common} />
          </div>

          <div className={adm.panel}>
            <div className={adm.panelHead}><h2>Activity over time</h2><span className={adm.statHint}>{d && `${d.range.from} to ${d.range.to} (IST)`}</span></div>
            <div className={adm.panelBody}>
              {d ? (
                <TrendChart label="Activity over time" days={d.series.days} series={[
                  { key: 'users', label: 'New users', color: COLORS.blue, values: d.series.users },
                  { key: 'comparisons', label: 'Fare comparisons', color: COLORS.cyan, values: d.series.comparisons },
                  { key: 'redirects', label: 'Provider redirects', color: COLORS.amber, values: d.series.redirects },
                ]} />
              ) : <span className={`${adm.skeleton} ${styles.skelBlock}`} />}
            </div>
          </div>

          <div className={styles.charts}>
            <Panel title="Queries received vs resolved" id="q-trend">
              {d ? (
                <TrendChart label="Queries received versus resolved" days={d.series.days} series={[
                  { key: 'in', label: 'Received', color: COLORS.blue, values: d.series.queriesReceived },
                  { key: 'out', label: 'Resolved', color: COLORS.green, values: d.series.queriesResolved },
                ]} />
              ) : <span className={`${adm.skeleton} ${styles.skelBlock}`} />}
            </Panel>
            <Panel title="Query status" id="q-status">
              {t ? <DonutChart centerLabel="queries" items={[
                { label: 'Open', value: t.queries.open, color: COLORS.amber },
                { label: 'In progress', value: t.queries.inProgress, color: COLORS.blue },
                { label: 'Resolved', value: t.queries.resolved, color: COLORS.green },
              ]} /> : <span className={`${adm.skeleton} ${styles.skelBlock}`} />}
            </Panel>
          </div>

          <Panel title="Provider selections" id="prov-sel">
            {d ? (
              providerBars.length ? (
                <>
                  <ValueBars items={providerBars} />
                  <p className={adm.statHint} style={{ marginTop: 10 }}>How many times riders chose “Book ride” on each provider in this period. A selection is not a confirmed booking.</p>
                </>
              ) : <StateMessage title="No provider selections yet">Nothing was selected in this period.</StateMessage>
            ) : <span className={`${adm.skeleton} ${styles.skelBlock}`} />}
          </Panel>
        </div>

        <aside className={styles.aside} aria-label="Activity and status">
          <Panel title="Recent activity" id="recent-activity">
            {!d ? <span className={`${adm.skeleton} ${styles.skelBlock}`} /> : d.activity.length === 0 ? (
              <StateMessage title="No activity yet">Registrations, comparisons and queries will appear here.</StateMessage>
            ) : (
              <ol className={styles.timeline}>
                {d.activity.map((a) => (
                  <li key={a.id} style={{ '--c': DOT[a.type] }}><span>{a.label}</span><time dateTime={a.at}>{formatDateTime(a.at)}</time></li>
                ))}
              </ol>
            )}
          </Panel>
          <Panel title="Platform status" id="platform-status">
            {health.loading && <StateMessage title="Checking platform status…" />}
            {health.error && <StateMessage kind="error" title="Status check failed" onRetry={health.reload}>The API reported a problem or could not be reached.</StateMessage>}
            {health.data && (
              <p>
                <Badge tone={health.data.db === 'up' ? 'good' : 'bad'}>{health.data.db === 'up' ? 'Database connected' : 'Database unavailable'}</Badge>{' '}
                API running for {uptimeLabel(health.data.uptimeSeconds)} since its last restart.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
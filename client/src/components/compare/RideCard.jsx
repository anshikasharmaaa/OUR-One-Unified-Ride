import styles from './RideCard.module.css';

const SOURCE = {
    PROVIDER_API: { label: 'Live from provider', tone: 'live' },
    LOCAL_RATE_CARD: { label: 'Rate-card estimate', tone: 'est' },
    OUR_ESTIMATE_TEST: { label: 'Test estimate', tone: 'test' },
    NONE: { label: 'Not connected', tone: 'none' },
};
const AVAIL = { AVAILABLE: 'Available', UNAVAILABLE: 'Unavailable', UNKNOWN: 'Availability unknown' };

export const formatDuration = (s) => {
    const m = Math.max(1, Math.round(s / 60));
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

function money(n, currency) {
    try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n); } catch { return `${currency} ${n}`; }
}

export default function RideCard({ option: o }) {
    const src = SOURCE[o.source] || SOURCE.NONE;
    const fare = o.fare ? (o.fare.min === o.fare.max ? money(o.fare.min, o.fare.currency) : `${money(o.fare.min, o.fare.currency)} – ${money(o.fare.max, o.fare.currency)}`) : null;
    return (
        <article className={`${styles.card} ${o.fare ? '' : styles.muted}`} aria-label={`${o.provider} ${o.categoryLabel}`}>
            <header className={styles.head}>
                <div>
                    <h3 className={styles.provider}>{o.provider}</h3>
                    <p className={styles.cat}>{o.categoryLabel}</p>
                </div>
                <span className={`${styles.badge} ${styles[src.tone]}`}>{src.label}</span>
            </header>

            <p className={styles.fare}>{fare || 'No price shown'}</p>

            <dl className={styles.facts}>
                <div><dt>Arrival</dt><dd>{o.etaMinutes != null ? `${o.etaMinutes} min away` : 'Not available'}</dd></div>
                <div><dt>Trip</dt><dd>{o.tripDurationSeconds != null ? formatDuration(o.tripDurationSeconds) : '—'}</dd></div>
                <div><dt>Status</dt><dd>{AVAIL[o.availability] || AVAIL.UNKNOWN}</dd></div>
            </dl>

            {o.note && <p className={styles.note}>{o.note}</p>}
        </article>
    );
}
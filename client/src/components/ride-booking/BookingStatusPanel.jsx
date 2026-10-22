import Icon from '../common/Icon';
import styles from './BookingStatusPanel.module.css';

export default function BookingStatusPanel({ data }) {
    const cancelled = data.status === 'cancelled';
    const tone = cancelled ? 'bad' : data.status === 'no_driver' ? 'warn' : data.settled ? 'ok' : 'busy';
    const pct = cancelled || data.status === 'no_driver' ? ((data.stepIndex + 1) / data.steps.length) * 100 : ((data.stepIndex + (data.settled ? 1 : 0.5)) / data.steps.length) * 100;

    return (
        <section className={`${styles.panel} ${styles[tone]}`} aria-labelledby="bk-status">
            <p className={styles.mode}>
                <span className={styles.pill}>Demo booking</span>
                Simulated. No ride has been requested from {data.providerName}.
            </p>
            <h1 id="bk-status" className={styles.status} aria-live="polite">{data.statusLabel}</h1>
            {data.status === 'en_route' && !data.settled && data.etaMinutesRemaining != null && (
                <p className={styles.eta}>Arriving in about {Math.max(1, data.etaMinutesRemaining)} min (simulated)</p>
            )}
            {data.status === 'no_driver' && <p className={styles.eta}>No demo driver is configured, so nobody was assigned.</p>}

            <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Booking progress">
                <span className={styles.fill} style={{ width: `${pct}%` }} />
            </div>
            <ol className={styles.steps}>
                {data.steps.map((s, i) => {
                    const done = i < data.stepIndex || (i === data.stepIndex && (data.settled || cancelled));
                    const current = i === data.stepIndex && !data.settled && !cancelled;
                    return (
                        <li key={s.key} className={`${styles.step} ${done ? styles.done : ''} ${current ? styles.current : ''}`} aria-current={current ? 'step' : undefined}>
                            <span className={styles.dot}>{done ? <Icon name="check" size={14} /> : i + 1}</span>
                            <span className={styles.label}>{s.label}</span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
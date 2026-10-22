import Icon from '../common/Icon';
import { fareText } from '../../utils/rideFormat';
import { VALUE_WEIGHTS } from '../../utils/rideRecommendations';
import styles from './RideRecommendations.module.css';

export default function RideRecommendations({ options, rec }) {
    const byId = new Map(options.map((o) => [o.id, o]));
    const items = [
        { id: rec.cheapestId, title: 'Cheapest estimated option', icon: 'receipt', detail: (o) => fareText(o.fare), none: 'No comparable fares' },
        { id: rec.fastestId, title: 'Fastest pickup', icon: 'clock', detail: (o) => `${o.etaMinutes} min away`, none: 'No pickup times available' },
        { id: rec.bestValueId, title: 'Best overall value', icon: 'check', detail: (o) => `${fareText(o.fare)} · ${o.etaMinutes} min`, none: 'Needs 2+ options with pickup times' },
    ];
    return (
        <div>
            <ul className={styles.row} aria-label="Recommendations">
                {items.map((it) => {
                    const o = it.id ? byId.get(it.id) : null;
                    return (
                        <li key={it.title} className={`${styles.card} ${o ? '' : styles.empty}`}>
                            <span className={styles.icon}><Icon name={it.icon} size={18} /></span>
                            <div className={styles.body}>
                                <span className={styles.title}>{it.title}{o && rec.isDemo && <em className={styles.demo}>Demo result</em>}</span>
                                {o ? (
                                    <>
                                        <strong className={styles.who}>{o.providerName} · {o.vehicleLabel}</strong>
                                        <span className={styles.detail}>{it.detail(o)}</span>
                                    </>
                                ) : <span className={styles.detail}>{it.none}</span>}
                            </div>
                        </li>
                    );
                })}
            </ul>
            <details className={styles.how}>
                <summary>How “best value” is chosen</summary>
                <p>
                    Fare counts {VALUE_WEIGHTS.fare * 100}% and pickup time {VALUE_WEIGHTS.eta * 100}%, after scaling both across the options shown.
                    Unavailable, expired or unpriced options never win, and at least two options with a pickup time are needed.
                </p>
            </details>
        </div>
    );
}
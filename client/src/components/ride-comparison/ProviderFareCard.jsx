import Icon from '../common/Icon';
import { VEHICLE_ICON } from '../../utils/rideFormat';
import { formatAmount, primaryFare } from '../../utils/fareDisplay';
import styles from './ProviderFareCard.module.css';

export default function ProviderFareCard({ estimate: e, lowest, selected, expired, busy, locked, onBook }) {
    const price = formatAmount(primaryFare(e.fare));
    const live = e.source === 'live'; // pickup time is only shown when it comes from a real provider response
    const meta = [];
    if (e.durationMinutes != null) meta.push(`${e.durationMinutes} min trip`);
    if (live && e.etaMinutes != null) meta.push(`Pickup in ${e.etaMinutes} min`);

    const disabled = !price || expired || busy || locked;

    return (
        <article
            className={`${styles.card} ${lowest ? styles.best : ''} ${selected ? styles.selected : ''}`}
            data-card-id={e.id}
            aria-label={`${e.providerName} ${e.vehicleLabel}${price ? `, ${price}` : ''}`}
        >
            <div className={styles.head}>
                <span className={styles.cat}>
                    <span className={styles.icon}><Icon name={VEHICLE_ICON[e.vehicleType] || 'car'} size={18} /></span>
                    {e.vehicleLabel}
                </span>
                {lowest && <span className={styles.tag}>Lowest fare</span>}
            </div>

            <div className={styles.priceBlock}>
                <span className={styles.priceLabel}>Estimated fare</span>
                <p className={styles.price}>{price || 'Unavailable'}</p>
                {meta.length > 0 && <p className={styles.meta}>{meta.join(' · ')}</p>}
                {expired && <p className={styles.expired} role="status">Estimate expired. Refresh to book.</p>}
            </div>

            <button
                type="button"
                className={styles.book}
                onClick={onBook}
                disabled={disabled}
                aria-busy={busy || undefined}
                aria-label={`Book ${e.providerName} ${e.vehicleLabel} ride`}
            >
                {busy ? <><span className={styles.spin} aria-hidden="true" />Please wait…</> : 'Book ride'}
            </button>
        </article>
    );
}
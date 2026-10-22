import ProviderCarousel from './ProviderCarousel';
import ProviderFareCard from './ProviderFareCard';
import ProviderLogo from './ProviderLogo';
import { isExpired } from '../../utils/rideRecommendations';
import styles from './ProviderRow.module.css';

/** One provider = one row = one horizontal slider holding all of that provider's ride options. */
export default function ProviderRow({ provider, options, emptyMessage, failed, onRetry, lowestIds, selectedId, now, bookingId, onBook }) {
    const labelId = `prov-${provider.id}-h`;
    const header = (
        <div className={styles.who}>
            <ProviderLogo id={provider.id} name={provider.name} size="md" src={provider.logoUrl} />
            <div className={styles.text}>
                <h3 id={labelId} className={styles.name}>{provider.name}</h3>
                {options.length > 0 && <p className={styles.count}>{options.length === 1 ? '1 ride option' : `${options.length} ride options`}</p>}
            </div>
        </div>
    );

    return (
        <section className={styles.row} aria-labelledby={labelId}>
            {options.length > 0 ? (
                <ProviderCarousel label={`${provider.name} ride options`} focusId={selectedId} header={header}>
                    {options.map((e) => (
                        <li key={e.id}>
                            <ProviderFareCard
                                estimate={e}
                                lowest={lowestIds.has(e.id)}
                                selected={selectedId === e.id}
                                expired={isExpired(e, now)}
                                busy={bookingId === e.id}
                                locked={bookingId !== null}
                                onBook={() => onBook(e)}
                            />
                        </li>
                    ))}
                </ProviderCarousel>
            ) : (
                <>
                    <div className={styles.emptyHead}>{header}</div>
                    <p className={styles.empty}>
                        {emptyMessage}
                        {failed && <button type="button" className={styles.retry} onClick={onRetry}>Try again</button>}
                    </p>
                </>
            )}
        </section>
    );
}
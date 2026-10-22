import { useState } from 'react';
import Icon from '../../components/common/Icon';
import Pagination from '../../components/admin/Pagination';
import StateMessage from '../../components/admin/StateMessage';
import ProfileShell from './ProfileShell';
import useApi from '../../hooks/useApi';
import { accountService } from '../../services/accountService';
import { formatDateTime, VEHICLE_SHORT } from '../../utils/format';
import { fareText, SOURCE_LABEL } from '../../utils/rideFormat';
import { EVENT_LABEL, EVENT_NOTE, EVENT_TONE, PROVIDER_NAME, RIDE_FILTERS } from '../../utils/rideEvents';
import styles from './Profile.module.css';

const LIMIT = 10;

export default function MyRides() {
    const [page, setPage] = useState(1);
    const [type, setType] = useState();
    const { data, loading, error, reload } = useApi(() => accountService.rides(page, LIMIT, type), [page, type]);

    return (
        <ProfileShell title="My Rides" lead="A permanent record of what you did on OUR. It can’t be edited or deleted. After 180 days, exact locations are reduced to about 1 km.">
            <div className={styles.stack}>
                <p className={`${styles.notice} ${styles.warnBox}`}>
                    <Icon name="receipt" size={18} />
                    <span>OUR compares fares and sends you to providers. Providers don’t tell us whether you booked or finished a ride, so there is no “completed” status here. Bookings made inside OUR are simulations and are labelled that way.</span>
                </p>

                <div className={styles.tabs} role="group" aria-label="Filter activity">
                    {RIDE_FILTERS.map((f) => (
                        <button key={f.label} type="button" className={`${styles.tab} ${type === f.value ? styles.tabOn : ''}`} aria-pressed={type === f.value} onClick={() => { setPage(1); setType(f.value); }}>{f.label}</button>
                    ))}
                </div>

                {error && <div className={styles.card}><StateMessage kind="error" title="Couldn’t load your rides" onRetry={reload}>{error}</StateMessage></div>}
                {loading && !data && <div className={`${styles.card} ${styles.pad}`} role="status" aria-label="Loading your rides" style={{ minHeight: 200 }} />}

                {data && data.items.length === 0 && (
                    <div className={`${styles.card} ${styles.empty}`}>
                        <strong>{type ? 'Nothing here yet' : 'No ride activity yet'}</strong>
                        <span>{type ? 'No activity matches this filter.' : 'Compare fares for a trip and it will show up here.'}</span>
                    </div>
                )}

                {data && data.items.length > 0 && (
                    <ul className={styles.list} aria-busy={loading || undefined}>
                        {data.items.map((e) => (
                            <li key={e.id} className={`${styles.card} ${styles.item}`}>
                                <div className={styles.itemTop}>
                                    <span className={`${styles.chip} ${styles[`tone_${EVENT_TONE[e.type]}`]}`}>{EVENT_LABEL[e.type]}</span>
                                    <time dateTime={e.createdAt}>{formatDateTime(e.createdAt)}</time>
                                </div>
                                <p className={styles.route}>{e.pickup || 'Pickup not recorded'} <Icon name="arrowRight" size={16} /> {e.dropoff || 'Drop not recorded'}</p>
                                <p className={styles.meta}>
                                    {[e.provider && PROVIDER_NAME[e.provider], e.vehicleType && (VEHICLE_SHORT[e.vehicleType.toUpperCase()] || e.vehicleType), e.fare && `${fareText(e.fare)} (estimate)`].filter(Boolean).join(' · ') || EVENT_NOTE[e.type]}
                                </p>
                                <details>
                                    <summary>Details</summary>
                                    <dl>
                                        <div><dt>What this means</dt><dd>{EVENT_NOTE[e.type]}</dd></div>
                                        {e.reference && <div><dt>Booking reference</dt><dd>{e.reference}</dd></div>}
                                        {e.fareSource && <div><dt>Fare source</dt><dd>{SOURCE_LABEL[e.fareSource] || e.fareSource}. This is an estimate, not a confirmed fare.</dd></div>}
                                        {e.distanceMeters != null && <div><dt>Distance</dt><dd>{(e.distanceMeters / 1000).toFixed(1)} km</dd></div>}
                                        <div><dt>Record ID</dt><dd>{e.id}</dd></div>
                                    </dl>
                                </details>
                            </li>
                        ))}
                    </ul>
                )}
                {data && !error && <div className={styles.card}><Pagination page={page} limit={LIMIT} total={data.total} onPage={setPage} disabled={loading} /></div>}
            </div>
        </ProfileShell>
    );
}
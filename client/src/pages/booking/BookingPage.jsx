import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import RouteMap from '../../components/compare/RouteMap';
import Alert from '../../components/common/Alert';
import Icon from '../../components/common/Icon';
import ProviderLogo from '../../components/ride-comparison/ProviderLogo';
import ProviderRedirectDialog from '../../components/ride-booking/ProviderRedirectDialog';
import useBooking from '../../hooks/useBooking';
import { decodePolyline } from '../../utils/polyline';
import { formatAmount, primaryFare } from '../../utils/fareDisplay';
import { VEHICLE_ICON } from '../../utils/rideFormat';
import { CONTACT_EMAIL } from '../../config/site';
import styles from './BookingPage.module.css';

const km = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);
const duration = (s) => {
    const m = Math.max(1, Math.round(s / 60));
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

export default function BookingPage() {
    const { id } = useParams();
    const { status, data, error, retry } = useBooking(id);
    const [linkOpen, setLinkOpen] = useState(false);
    const autoOpened = useRef(false);

    // Open the provider dialog once on arrival, so "Book ride" leads straight to the real handoff.
    // To require an extra click instead, delete this effect.
    useEffect(() => {
        if (autoOpened.current || !data?.providerLink?.available) return;
        autoOpened.current = true;
        setLinkOpen(true);
    }, [data]);

    // The map is rebuilt when pickup/dropoff/path identity changes, so keep them stable across polls.
    const key = data ? [data.pickup.lat, data.pickup.lng, data.dropoff.lat, data.dropoff.lng, data.route.encodedPolyline].join('|') : '';
    const geo = useMemo(
        () => (data ? { pickup: data.pickup, dropoff: data.dropoff, path: decodePolyline(data.route.encodedPolyline) } : null),
        [key], // eslint-disable-line react-hooks/exhaustive-deps
    );

    if (status === 'loading') return <main className={styles.page}><div className={styles.skel} role="status" aria-label="Loading" /></main>;
    if (status === 'error' || !data) {
        return (
            <main className={styles.page}>
                <div className={styles.state} role="alert">
                    <h1>We couldn’t open this page</h1>
                    <p>{error || 'It may have been removed or belongs to another account.'}</p>
                    <div className={styles.row}>
                        <button type="button" className={styles.primary} onClick={retry}>Try again</button>
                        <Link to="/" className={styles.ghost}>Start a new search</Link>
                    </div>
                </div>
            </main>
        );
    }

    const backTo = `/compare-rides/${data.comparisonId}`;
    const backState = { selectedId: `${data.provider}-${data.vehicleType}` };
    const available = !!data.providerLink?.available;
    const price = formatAmount(primaryFare(data.fare));

    return (
        <main className={styles.page}>
            <Helmet><title>Continue to {data.providerName} · OUR</title></Helmet>

            <nav className={styles.nav} aria-label="Navigation">
                <Link to={backTo} state={backState} className={styles.back}><Icon name="chevronLeft" size={16} />Back to ride options</Link>
            </nav>

            {error && <Alert variant="error">{error}</Alert>}

            <div className={styles.layout}>
                <section className={`${styles.card} ${styles.summary}`} aria-labelledby="bk-h">
                    <div className={styles.provider}>
                        <ProviderLogo id={data.provider} name={data.providerName} />
                        <div>
                            <h1 id="bk-h" className={styles.h1}>{data.providerName}</h1>
                            <p className={styles.sub}><Icon name={VEHICLE_ICON[data.vehicleType] || 'car'} size={16} />{data.vehicleLabel}</p>
                        </div>
                    </div>

                    <div className={styles.priceBlock}>
                        <span className={styles.label}>Estimated fare</span>
                        <p className={styles.amount}>{price || '—'}</p>
                    </div>

                    <ol className={styles.stops}>
                        <li><span className={styles.pinA}>A</span><span><small>Pickup</small>{data.pickup.address}</span></li>
                        <li><span className={styles.pinB}>B</span><span><small>Drop-off</small>{data.dropoff.address}</span></li>
                    </ol>
                    <p className={styles.trip}>{km(data.route.distanceMeters)} · {duration(data.route.durationSeconds)}</p>

                    <div className={styles.actions}>
                        <button type="button" className={styles.primary} onClick={() => setLinkOpen(true)} disabled={!available}>
                            Continue to {data.providerName}
                        </button>
                        <p className={styles.note}>
                            {available
                                ? `You’ll finish booking on ${data.providerName}.`
                                : `Opening ${data.providerName} from OUR isn’t available yet.`}
                        </p>
                        <Link to={backTo} state={backState} className={styles.ghost}>Back to ride options</Link>
                    </div>
                </section>

                <div className={styles.mapSlot}>
                    <RouteMap pickup={geo.pickup} dropoff={geo.dropoff} path={geo.path} />
                </div>
            </div>

            {CONTACT_EMAIL && (
                <p className={styles.help}>Need help? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
            )}

            <ProviderRedirectDialog
                open={linkOpen}
                bookingId={data.id}
                providerName={data.providerName}
                link={data.providerLink}
                pickup={data.pickup}
                dropoff={data.dropoff}
                onClose={() => setLinkOpen(false)}
            />
        </main>
    );
}
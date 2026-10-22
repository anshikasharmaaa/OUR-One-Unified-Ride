import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Alert from '../common/Alert';
import Icon from '../common/Icon';
import ProviderRow from './ProviderRow';
import useRideEstimates from '../../hooks/useRideEstimates';
import { rideBookingService } from '../../services/rideComparisonService';
import { apiErrorMessage } from '../../utils/errors';
import { isExpired } from '../../utils/rideRecommendations';
import { primaryFare } from '../../utils/fareDisplay';
import { VEHICLE_OPTIONS, VEHICLE_LABEL } from '../../config/site';
import styles from './FareComparisonSection.module.css';

// One row per provider, always in this order. Ids must match the backend provider ids and the logo file names.
const PROVIDERS = [
    { id: 'rapido', name: 'Rapido' },
    { id: 'ola', name: 'Ola' },
    { id: 'uber', name: 'Uber' },
];
const VEHICLE_ORDER = ['bike', 'auto', 'economy_cab', 'premium_cab'];
const order = (e) => {
    const i = VEHICLE_ORDER.indexOf(e.vehicleType);
    return i === -1 ? 99 : i;
};
const amount = (e) => primaryFare(e.fare)?.amount ?? Infinity;
const bookable = (e, now) => primaryFare(e.fare) && !isExpired(e, now) && e.availability?.status !== 'unavailable';

export default function FareComparisonSection({ comparison }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { status, data, error, refresh } = useRideEstimates(comparison.id);
    const [category, setCategory] = useState((comparison.vehicleType || 'ANY').toLowerCase());
    const [bookingId, setBookingId] = useState(null);
    const [bookError, setBookError] = useState('');
    const [now, setNow] = useState(() => Date.now());
    const inFlight = useRef(false); // synchronous guard: state updates lag behind rapid double-clicks
    const selectedId = location.state?.selectedId || null; // card chosen before returning from a booking

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 15000); // so "expired" flips without a reload
        return () => clearInterval(t);
    }, []);

    const all = useMemo(() => data?.estimates ?? [], [data]);
    const visible = useMemo(() => (category === 'any' ? all : all.filter((e) => e.vehicleType === category)), [all, category]);
    const catLabel = VEHICLE_LABEL[category.toUpperCase()] || 'this ride type';

    const rows = useMemo(
        () => PROVIDERS.map((p) => {
            const listed = data?.providers;
            const meta = (listed ?? []).find((x) => x.id === p.id);
            if (listed?.length && !meta) return null; // the server omits providers an admin deactivated
            const options = visible.filter((e) => e.provider === p.id).sort((a, b) => order(a) - order(b));
            const failed = meta?.state === 'error';
            const hasOther = all.some((e) => e.provider === p.id);
            return {
                provider: { id: p.id, name: meta?.name || p.name, logoUrl: meta?.logoUrl },
                options,
                failed,
                emptyMessage: failed ? 'We couldn’t load this provider’s fares.' : hasOther ? `No ${catLabel} option for this trip.` : 'No fares available right now.',
            };
        }).filter(Boolean),
        [visible, all, data, catLabel],
    );

    // "Lowest fare" marks the cheapest option within a ride type across providers, only when there is one clear winner.
    const lowestIds = useMemo(() => {
        const set = new Set();
        const groups = {};
        visible.forEach((e) => { if (bookable(e, now)) (groups[e.vehicleType] ||= []).push(e); });
        Object.values(groups).forEach((g) => {
            if (g.length < 2) return;
            const min = Math.min(...g.map(amount));
            const winners = g.filter((e) => amount(e) === min);
            if (winners.length === 1) set.add(winners[0].id);
        });
        return set;
    }, [visible, now]);

    const book = async (e) => {
        if (inFlight.current) return;
        inFlight.current = true;
        setBookingId(e.id);
        setBookError('');
        try {
            const b = await rideBookingService.create({ comparisonId: comparison.id, provider: e.provider, vehicleType: e.vehicleType });
            navigate(`/bookings/${b.id}`); // the booking page owns the provider-opening step
        } catch (err) {
            inFlight.current = false;
            setBookingId(null);
            setBookError(apiErrorMessage(err, 'We could not start this booking. Please try again.'));
        }
    };

    const anyExpired = visible.some((e) => isExpired(e, now));

    let body;
    if (status === 'loading') {
        body = (
            <div className={styles.rows} aria-busy="true" aria-label="Loading ride options">
                {PROVIDERS.map((p) => <div key={p.id} className={styles.skel} />)}
            </div>
        );
    } else if (status === 'error' || !data) {
        body = (
            <div className={styles.state} role="alert">
                <h3>We couldn’t load ride options</h3>
                <p>{error || 'Something went wrong.'}</p>
                <button type="button" className={styles.btn} onClick={refresh}>Try again</button>
            </div>
        );
    } else if (all.length === 0) {
        body = (
            <div className={styles.state}>
                <h3>No ride options right now</h3>
                <p>No provider returned a fare for this trip. Try again in a moment, or change your route.</p>
                <button type="button" className={styles.btn} onClick={refresh}>Try again</button>
            </div>
        );
    } else {
        body = (
            <>
                {anyExpired && <Alert variant="info">Some estimates have expired. <button type="button" className={styles.link} onClick={refresh}>Refresh estimates</button></Alert>}
                {bookError && <Alert variant="error">{bookError}</Alert>}

                <div className={styles.controls}>
                    <div className={styles.group} role="group" aria-label="Ride type">
                        {VEHICLE_OPTIONS.map((v) => {
                            const val = v.value.toLowerCase();
                            return <button key={v.value} type="button" aria-pressed={category === val} className={`${styles.chip} ${category === val ? styles.on : ''}`} onClick={() => setCategory(val)}>{v.label}</button>;
                        })}
                    </div>
                </div>

                <div className={styles.rows}>
                    {rows.map((r) => (
                        <ProviderRow
                            key={r.provider.id}
                            provider={r.provider}
                            options={r.options}
                            emptyMessage={r.emptyMessage}
                            failed={r.failed}
                            onRetry={refresh}
                            lowestIds={lowestIds}
                            selectedId={selectedId}
                            now={now}
                            bookingId={bookingId}
                            onBook={book}
                        />
                    ))}
                </div>
            </>
        );
    }

    return (
        <section id="compare" className={styles.section} aria-labelledby="compare-h">
            <div className={styles.head}>
                <div>
                    <h2 id="compare-h" className={styles.h2}>Compare ride options</h2>
                    <p className={styles.sub}>Estimated fares for this trip, side by side.</p>
                </div>
                <button type="button" className={styles.refresh} onClick={refresh} disabled={status === 'loading'}><Icon name="refresh" size={16} />Refresh</button>
            </div>
            {body}
            <p className={styles.legal}>Fares are estimates. The provider sets the final price.</p>
        </section>
    );
}
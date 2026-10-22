import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RouteMap from '../../components/compare/RouteMap';
import FareComparisonSection from '../../components/ride-comparison/FareComparisonSection';
import Alert from '../../components/common/Alert';
import { comparisonService } from '../../services/comparisonService';
import { apiErrorMessage } from '../../utils/errors';
import { decodePolyline } from '../../utils/polyline';
import { saveDraft } from '../../utils/compareDraft';
import { VEHICLE_LABEL } from '../../config/site';
import styles from './ComparePage.module.css';

const km = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);
const duration = (s) => {
    const m = Math.max(1, Math.round(s / 60));
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};
const splitAddress = (a = '') => {
    const p = a.split(',').map((s) => s.trim()).filter(Boolean);
    return { title: p.slice(0, 2).join(', ') || a, sub: p.slice(2).join(', ') };
};

export default function ComparePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [state, setState] = useState({ status: 'loading', data: null, error: '' });

    useEffect(() => {
        let alive = true;
        setState({ status: 'loading', data: null, error: '' });
        comparisonService.get(id)
            .then((data) => alive && setState({ status: 'ready', data, error: '' }))
            .catch((err) => {
                if (!alive) return;
                if (err.response?.status === 401) { navigate('/login', { state: { from: `/compare-rides/${id}` } }); return; }
                setState({ status: 'error', data: null, error: apiErrorMessage(err, 'We could not load this comparison.') });
            });
        return () => { alive = false; };
    }, [id, navigate]);

    const d = state.data;
    const path = useMemo(() => (d ? decodePolyline(d.route.encodedPolyline) : []), [d]);

    const editRoute = () => {
        saveDraft({ pickup: { text: d.pickup.address, place: d.pickup }, dropoff: { text: d.dropoff.address, place: d.dropoff }, vehicleType: d.vehicleType });
        navigate('/');
    };

    if (state.status === 'loading') return <main className={styles.page}><p className={styles.status} role="status">Loading your route…</p></main>;
    if (state.status === 'error') {
        return (
            <main className={styles.page}>
                <div className={`${styles.wrap} ${styles.errorBox}`}>
                    <Alert variant="error">{state.error}</Alert>
                    <p><Link to="/">Back to search</Link></p>
                </div>
            </main>
        );
    }

    const from = splitAddress(d.pickup.address);
    const to = splitAddress(d.dropoff.address);
    const rideType = VEHICLE_LABEL[d.vehicleType] || 'Any';

    return (
        <main className={styles.page}>
            <section className={styles.hero} aria-labelledby="route-h">
                <div className={styles.wrap}>
                    <p className={styles.eyebrow}>Compare rides</p>
                    <h1 id="route-h" className={styles.title}>Your route</h1>

                    <div className={styles.summary}>
                        <ol className={styles.stops}>
                            <li className={styles.stop}>
                                <span className={`${styles.dot} ${styles.dotA}`} aria-hidden="true">A</span>
                                <div className={styles.addr}>
                                    <span className={styles.tag}>Pickup</span>
                                    <strong>{from.title}</strong>
                                    {from.sub && <span className={styles.sub}>{from.sub}</span>}
                                </div>
                            </li>
                            <li className={styles.stop}>
                                <span className={`${styles.dot} ${styles.dotB}`} aria-hidden="true">B</span>
                                <div className={styles.addr}>
                                    <span className={styles.tag}>Drop-off</span>
                                    <strong>{to.title}</strong>
                                    {to.sub && <span className={styles.sub}>{to.sub}</span>}
                                </div>
                            </li>
                        </ol>

                        <div className={styles.side}>
                            <dl className={styles.metrics}>
                                <div><dt>Distance</dt><dd>{km(d.route.distanceMeters)}</dd></div>
                                <div><dt>Drive time</dt><dd>{duration(d.route.durationSeconds)}</dd></div>
                                <div><dt>Ride type</dt><dd>{rideType}</dd></div>
                            </dl>
                            <button type="button" className={styles.edit} onClick={editRoute}>Edit route</button>
                        </div>
                    </div>
                </div>
            </section>

            <div className={`${styles.wrap} ${styles.body}`}>
                <div className={styles.mapSlot}>
                    <RouteMap pickup={d.pickup} dropoff={d.dropoff} path={path} />
                </div>
                <p className={styles.fine}>Route and distance from OpenStreetMap road data. Drive time is a free-flow estimate and does not include live traffic.</p>

                <FareComparisonSection comparison={d} />
            </div>
        </main>
    );
}
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import RouteMap from '../../components/compare/RouteMap';
import RideCard from '../../components/compare/RideCard';
import Alert from '../../components/common/Alert';
import Icon from '../../components/common/Icon';
import useApi from '../../hooks/useApi';
import { comparisonService } from '../../services/comparisonService';
import { saveDraft } from '../../utils/compareDraft';
import { anyEta, anyFare, formatDistance, formatDuration, sortOptions } from '../../utils/compareOptions';
import styles from './CompareRidesPage.module.css';

const MODES = [
    { id: 'recommended', label: 'Recommended' },
    { id: 'cheapest', label: 'Cheapest' },
    { id: 'fastest', label: 'Fastest' },
];

export default function CompareRidesPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, loading, error, reload } = useApi(() => comparisonService.get(id), [id]);
    const [mode, setMode] = useState('recommended');
    const sorted = useMemo(() => (data ? sortOptions(data.options, mode) : []), [data, mode]);

    const editRoute = () => {
        saveDraft({
            pickup: { text: data.pickup.address, place: data.pickup },
            dropoff: { text: data.dropoff.address, place: data.dropoff },
            vehicleType: data.vehicleType,
        });
        navigate('/');
    };

    if (loading) return <div className={styles.page}><div className={styles.skeleton} role="status" aria-label="Loading your comparison" /></div>;
    if (error || !data) {
        return (
            <div className={styles.page}>
                <div className={styles.state} role="alert">
                    <h1>We couldn’t open this comparison</h1>
                    <p>{error || 'It may have been removed or belongs to another account.'}</p>
                    <div className={styles.stateActions}>
                        <button type="button" onClick={reload} className={styles.btn}>Try again</button>
                        <Link to="/" className={styles.btnGhost}>Start a new search</Link>
                    </div>
                </div>
            </div>
        );
    }

    const noFares = !anyFare(data.options);
    return (
        <div className={styles.page}>
            <Helmet><title>Compare rides · OUR</title></Helmet>

            <header className={styles.top}>
                <div className={styles.trip}>
                    <h1>Compare rides</h1>
                    <ol className={styles.stops}>
                        <li><span className={styles.pinA}>A</span>{data.pickup.address}</li>
                        <li><span className={styles.pinB}>B</span>{data.dropoff.address}</li>
                    </ol>
                </div>
                <div className={styles.facts}>
                    <div><span>Distance</span><strong>{formatDistance(data.route.distanceMeters)}</strong></div>
                    <div><span>Drive time</span><strong>{formatDuration(data.route.durationSeconds)}</strong></div>
                    <button type="button" className={styles.edit} onClick={editRoute}><Icon name="swap" size={16} />Edit route</button>
                </div>
            </header>
            <p className={styles.src}>Real road route and traffic-aware drive time from Google Maps.</p>

            <RouteMap pickup={data.pickup} dropoff={data.dropoff} encodedPolyline={data.route.encodedPolyline} />

            <section className={styles.results} aria-labelledby="options-title">
                <div className={styles.bar}>
                    <h2 id="options-title">Ride options</h2>
                    <div className={styles.sort} role="radiogroup" aria-label="Sort ride options">
                        {MODES.map((m) => (
                            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={`${styles.chip} ${mode === m.id ? styles.on : ''}`} onClick={() => setMode(m.id)}>{m.label}</button>
                        ))}
                    </div>
                </div>

                {noFares && <Alert variant="info">No live fares are connected yet, so no prices are shown — OUR doesn’t guess. Cards update automatically when authorised provider data or configured rate cards are available.</Alert>}
                {mode === 'fastest' && !anyEta(data.options) && <Alert variant="info">Arrival times aren’t available from the connected sources, so “Fastest” keeps the default order.</Alert>}
                {mode === 'cheapest' && !noFares && !data.options.every((o) => o.fare) && <p className={styles.hint}>Options without a fare are listed last.</p>}

                <ul className={styles.grid}>{sorted.map((o) => <RideCard key={o.id} option={o} />)}</ul>
                <p className={styles.legal}>OUR compares options and doesn’t book rides. Any fare shown is an estimate; the provider sets the final price. Cards labelled “TEST estimate” use test rates and are not live prices.</p>
            </section>
        </div>
    );
}
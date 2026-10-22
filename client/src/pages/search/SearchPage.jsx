import { useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SearchPanel from '../../components/home/SearchPanel';
import Alert from '../../components/common/Alert';
import Icon from '../../components/common/Icon';
import { useAuth } from '../../context/AuthContext';
import { VEHICLE_LABEL } from '../../config/site';
import styles from './SearchPage.module.css';

export default function SearchPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const { status } = useAuth();
  const resultRef = useRef(null);
  const [submitted, setSubmitted] = useState(location.state?.submitted || null);
  const wanted = params.get('vehicle');
  const vehicleType = VEHICLE_LABEL[wanted] ? wanted : submitted?.vehicleType || 'ANY';

  const onSubmitted = (result, values) => {
    setSubmitted({ ...values, result });
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  return (
    <div className={styles.page}>
      <Helmet><title>Search rides · OUR</title></Helmet>
      <div className="container">
        <header className={styles.head}>
          <p className={styles.eyebrow}>Search Rides</p>
          <h1>Where are you headed?</h1>
          <p className={styles.lede}>Enter your trip and choose a ride type. OUR records your search so we can build the comparison you’ll use.</p>
        </header>

        <div className={styles.body}>
          <SearchPanel
            key={vehicleType}
            idPrefix="search"
            showVehicle
            buttonLabel="Compare rides"
            initial={{ pickup: submitted?.pickup, dropoff: submitted?.dropoff, vehicleType }}
            onSubmitted={onSubmitted}
          />

          <div ref={resultRef} tabIndex={-1} className={styles.result} aria-live="polite">
            {submitted ? (
              <section className={styles.card} aria-labelledby="result-title">
                <p className={styles.ok}><Icon name="check" size={18} />Search received</p>
                <h2 id="result-title">{submitted.pickup} <Icon name="arrowRight" size={20} className={styles.arrow} /> {submitted.dropoff}</h2>
                <p className={styles.meta}>Ride type: {VEHICLE_LABEL[submitted.vehicleType]} · Reference {submitted.result.id.slice(-6).toUpperCase()}</p>
                <Alert variant="info">
                  Live fare comparison across providers isn’t available yet, so there are no fares to show — and we won’t make any up. Your search has been recorded to help us prepare it.
                </Alert>
                <div className={styles.actions}>
                  <Link to={{ pathname: '/', hash: '#explore' }}>Explore ride types</Link>
                  {status !== 'authenticated' && <Link to="/signup">Create a free account</Link>}
                </div>
              </section>
            ) : (
              <section className={styles.empty} aria-label="Search results">
                <Icon name="search" size={28} />
                <p>Your search summary will appear here after you press <strong>Compare rides</strong>.</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

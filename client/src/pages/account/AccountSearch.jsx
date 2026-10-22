import { useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Panel from '../../components/admin/Panel';
import SearchPanel from '../../components/home/SearchPanel';
import Alert from '../../components/common/Alert';
import Icon from '../../components/common/Icon';
import { VEHICLE_LABEL } from '../../config/site';
import styles from './Account.module.css';

export default function AccountSearch() {
  const location = useLocation();
  const [params] = useSearchParams();
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
      <Panel title="Where are you headed?" id="account-search">
        <p className={styles.muted}>Enter your trip and choose a ride type. Your search is saved to your account.</p>
        <SearchPanel key={vehicleType} idPrefix="rsearch" showVehicle initial={{ pickup: submitted?.pickup, dropoff: submitted?.dropoff, vehicleType }} onSubmitted={onSubmitted} />
      </Panel>
      <div ref={resultRef} tabIndex={-1} aria-live="polite">
        {submitted && (
          <Panel title="Search received" id="account-result">
            <div className={styles.result}>
              <p className={styles.ok}><Icon name="check" size={18} />Saved to your searches</p>
              <h3 className={styles.route}>{submitted.pickup} <Icon name="arrowRight" size={18} /> {submitted.dropoff}</h3>
              <p className={styles.meta}>Ride type: {VEHICLE_LABEL[submitted.vehicleType]} · Reference {submitted.result.id.slice(-6).toUpperCase()}</p>
              <Alert variant="info">Live fare comparison across providers isn’t available yet, so there are no fares to show — and we won’t make any up.</Alert>
              <Link to="/account/history">View all my searches</Link>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

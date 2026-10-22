import Icon from '../common/Icon';
import { formatNumber } from '../../utils/format';
import styles from './admin.module.css';

/** `delta` is a real percentage versus the previous equal period, or null/undefined when none can be computed (then nothing is shown). */
export default function StatCard({ icon, label, value, hint, loading, error, unavailable, delta }) {
  let body;
  if (loading) body = <><span className={styles.skeleton} style={{ width: '45%', height: 32 }} /><span className={styles.skeleton} style={{ width: '70%', height: 12 }} /></>;
  else if (error) body = <><span className={styles.statValueMuted}>Unavailable</span><span className={styles.statHint}>Could not load this metric.</span></>;
  else if (unavailable) body = <><span className={styles.statValueMuted}>Not available yet</span><span className={styles.statHint}>{hint}</span></>;
  else {
    body = (
      <>
        <span className={styles.statValue}>{formatNumber(value)}</span>
        {typeof delta === 'number' && (
          <span className={`${styles.delta} ${delta >= 0 ? styles.up : styles.down}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% <span className={styles.statHint}>vs previous period</span>
          </span>
        )}
        <span className={styles.statHint}>{hint}</span>
      </>
    );
  }
  return (
    <div className={styles.stat} aria-busy={loading || undefined}>
      <div className={styles.statTop}><span>{label}</span><span className={styles.statIcon}><Icon name={icon} size={20} /></span></div>
      {body}
    </div>
  );
}
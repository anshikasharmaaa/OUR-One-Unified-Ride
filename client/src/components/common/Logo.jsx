import { useState } from 'react';
import styles from './Logo.module.css';

/** The real OUR logo (client/public/assets/logo.png). Only the height is set so proportions are preserved. */
export default function Logo({ size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className={`${styles.fallback} ${styles[size]} ${className}`} role="img" aria-label="OUR — One Unified Ride">OUR</span>;
  }
  return (
    <img
      className={`${styles.logo} ${styles[size]} ${className}`}
      src="/assets/logo.png"
      alt="OUR — One Unified Ride"
      onError={() => {
        console.warn('OUR logo not found. Add your file at client/public/assets/logo.png');
        setFailed(true);
      }}
    />
  );
}

import Modal from './Modal';
import styles from './Modal.module.css';

export default function LocationPermissionModal({ open, busy, error, onUse, onManual, onClose }) {
    return (
        <Modal open={open} onClose={busy ? undefined : onClose} labelledBy="geo-title" describedBy="geo-text">
            <div className={styles.icon} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
            </div>
            <h2 id="geo-title" className={styles.title}>Use your current location?</h2>
            <p id="geo-text" className={styles.text}>
                We can fill in your pickup from your device’s location. Your browser will ask for permission only after you choose this. You can also type it yourself.
            </p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={onUse} disabled={busy} aria-busy={busy || undefined} data-autofocus>
                    {busy && <span className={styles.spin} aria-hidden="true" />}
                    {busy ? 'Finding you…' : 'Use My Current Location'}
                </button>
                <button type="button" className={styles.secondary} onClick={onManual} disabled={busy}>Enter Manually</button>
            </div>
        </Modal>
    );
}
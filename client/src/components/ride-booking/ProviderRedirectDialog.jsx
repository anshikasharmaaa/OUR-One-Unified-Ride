import { useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { rideBookingService } from '../../services/rideComparisonService';
import styles from './ProviderRedirectDialog.module.css';

/**
 * Tells the rider exactly where they are going before leaving OUR. A real <a> is used so the browser opens it natively.
 * "Provider opened" is saved to ride history only when the rider activates that link (once per time the dialog is
 * opened). It is a history note, not a booking: OUR cannot see what happens on the provider's site. If saving fails
 * the link still opens.
 */
export default function ProviderRedirectDialog({ open, bookingId, providerName, link, pickup, dropoff, onClose }) {
    const ref = useRef(null);
    const toast = useToast();
    const recorded = useRef(false);

    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        if (open && !d.open) { recorded.current = false; d.showModal(); }
        if (!open && d.open) d.close();
    }, [open]);

    const record = () => {
        if (recorded.current || !bookingId) return;
        recorded.current = true;
        rideBookingService.providerOpened(bookingId).catch(() => {
            toast.info(`${providerName} opened. We couldn’t add this to your ride history.`);
        });
    };

    return (
        <dialog ref={ref} className={styles.dialog} onClose={onClose} aria-labelledby="redir-h">
            {link?.available && (
                <div className={styles.body}>
                    <h2 id="redir-h" className={styles.h}>Continue on {providerName}?</h2>
                    <p>You’ll open <strong>{link.host}</strong> in a new tab with this trip:</p>
                    <p className={styles.trip}><strong>From:</strong> {pickup.address}<br /><strong>To:</strong> {dropoff.address}</p>
                    {link.note && <p className={styles.note}>{link.note}</p>}
                    <p className={styles.note}>OUR can’t see whether you book a ride there. Opening it is saved to your history as “Provider opened”, not as a booking.</p>
                    <p className={styles.note}>If nothing opens, copy this link into your browser:</p>
                    <input className={styles.copy} readOnly value={link.url} onFocus={(e) => e.target.select()} aria-label="Provider link" />
                    <div className={styles.actions}>
                        <a
                            className={styles.go} href={link.url} target="_blank" rel="noopener noreferrer"
                            onClick={() => { record(); onClose(); }}
                            onAuxClick={(e) => { if (e.button === 1) record(); }}
                        >Open {providerName}</a>
                        <button type="button" className={styles.cancel} onClick={onClose}>Stay on OUR</button>
                    </div>
                </div>
            )}
        </dialog>
    );
}
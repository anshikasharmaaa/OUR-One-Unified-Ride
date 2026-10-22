import Modal from './Modal';
import styles from './Modal.module.css';

export default function LoginRequiredModal({ open, onClose, onLogin, onSignup }) {
    return (
        <Modal open={open} onClose={onClose} labelledBy="login-req-title" describedBy="login-req-text">
            <div className={styles.icon} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
            </div>
            <h2 id="login-req-title" className={styles.title}>Log in to compare rides</h2>
            <p id="login-req-text" className={styles.text}>
                Comparing rides is for signed-in riders. Your pickup and drop-off are saved, so you can pick up right where you left off.
            </p>
            <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={onLogin} data-autofocus>Log in</button>
                <button type="button" className={styles.secondary} onClick={onClose}>Not now</button>
            </div>
            <p className={styles.footer}>
                New to OUR? <button type="button" className={styles.link} onClick={onSignup}>Create an account</button>
            </p>
        </Modal>
    );
}
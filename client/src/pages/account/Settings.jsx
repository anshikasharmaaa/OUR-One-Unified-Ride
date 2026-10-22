import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import StateMessage from '../../components/admin/StateMessage';
import ProfileShell from './ProfileShell';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/accountService';
import { apiErrorMessage } from '../../utils/errors';
import styles from './Profile.module.css';

const CLOSED = { open: false, confirm: '', password: '', confirmEmail: '' };

export default function Settings() {
    const toast = useToast();
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { data, loading, error, reload } = useApi(() => accountService.profile());
    const p = data?.profile;

    const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
    const [pwErr, setPwErr] = useState('');
    const [pwBusy, setPwBusy] = useState(false);
    const [del, setDel] = useState(CLOSED);
    const [delErr, setDelErr] = useState('');
    const [delBusy, setDelBusy] = useState(false);

    const changePassword = async (ev) => {
        ev.preventDefault();
        if (pw.newPassword.length < 8) { setPwErr('Your new password must be at least 8 characters.'); return; }
        setPwBusy(true);
        setPwErr('');
        try {
            await accountService.changePassword(pw);
            await signOut();
            toast.success('Password changed. Please sign in again.');
            navigate('/login', { replace: true });
        } catch (e) {
            setPwErr(apiErrorMessage(e, 'We could not change your password.'));
            setPwBusy(false);
        }
    };

    const deleteAccount = async (ev) => {
        ev.preventDefault();
        setDelBusy(true);
        setDelErr('');
        try {
            // Accounts with a password confirm with it. Google-only accounts have none, so they retype their email.
            await accountService.deleteAccount({
                confirm: del.confirm,
                ...(p.hasPassword ? { password: del.password } : { confirmEmail: del.confirmEmail.trim() }),
            });
            await signOut();
            toast.success('Your account has been deleted.'); // shown only after the server confirmed it
            navigate('/', { replace: true });
        } catch (e) {
            setDelErr(apiErrorMessage(e, 'We could not delete your account.'));
            setDelBusy(false);
        }
    };

    const logout = async () => {
        await signOut();
        toast.success('You have been signed out.');
        navigate('/', { replace: true });
    };

    const deleteReady = del.confirm === 'DELETE' && (p?.hasPassword ? Boolean(del.password) : Boolean(del.confirmEmail.trim()));

    return (
        <ProfileShell title="Settings">
            {loading && <div className={`${styles.card} ${styles.pad}`} role="status" aria-label="Loading" style={{ minHeight: 240 }} />}
            {error && <div className={styles.card}><StateMessage kind="error" title="Couldn’t load your settings" onRetry={reload}>{error}</StateMessage></div>}
            {p && (
                <div className={styles.stack}>
                    <section className={`${styles.card} ${styles.pad}`} aria-labelledby="st-acc">
                        <h2 id="st-acc" className={styles.sectionTitle}>Account</h2>
                        <dl className={styles.facts} style={{ border: 0, margin: 0, padding: 0 }}>
                            <div><dt>Email</dt><dd>{p.email}{p.emailVerified ? ' (verified)' : ''}</dd></div>
                            <div><dt>Phone</dt><dd>{p.phone ? `+91 ${p.phone}` : <span className={styles.muted}>Not added</span>}</dd></div>
                            <div><dt>Sign-in</dt><dd>{p.signInMethods.join(' + ') || '—'}</dd></div>
                        </dl>
                        <div className={styles.actions} style={{ marginTop: 'var(--sp-3)' }}>
                            <Link to="/profile/edit" className={styles.btnGhost}>Edit profile details</Link>
                            <Link to="/profile/favorites" className={styles.btnGhost}>Favorite locations</Link>
                        </div>
                        <p className={styles.hint} style={{ marginTop: 'var(--sp-2)' }}>Notifications appear inside OUR only. Email and SMS notifications aren’t sent, so there’s nothing to configure yet.</p>
                    </section>

                    <section className={`${styles.card} ${styles.pad}`} aria-labelledby="st-pw">
                        <h2 id="st-pw" className={styles.sectionTitle}>Change password</h2>
                        {p.hasPassword ? (
                            <form className={styles.form} onSubmit={changePassword} noValidate>
                                <div className={styles.field}>
                                    <label htmlFor="pw-cur">Current password</label>
                                    <input id="pw-cur" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((s) => ({ ...s, currentPassword: e.target.value }))} />
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="pw-new">New password</label>
                                    <input id="pw-new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((s) => ({ ...s, newPassword: e.target.value }))} aria-invalid={Boolean(pwErr)} />
                                    <span className={styles.hint}>At least 8 characters. You’ll be signed out on every device afterwards.</span>
                                </div>
                                {pwErr && <p className={styles.err} role="alert">{pwErr}</p>}
                                <div className={styles.actions}><button type="submit" className={styles.btn} disabled={pwBusy || !pw.currentPassword || !pw.newPassword}>{pwBusy ? 'Changing…' : 'Change password'}</button></div>
                            </form>
                        ) : (
                            <p className={styles.meta}>This account signs in with Google, so it has no password to change.</p>
                        )}
                    </section>

                    <section className={`${styles.card} ${styles.pad}`} aria-labelledby="st-sec">
                        <h2 id="st-sec" className={styles.sectionTitle}>Security</h2>
                        <div className={styles.actions}>
                            <button type="button" className={styles.btnGhost} onClick={logout}><Icon name="logout" size={16} />Log out</button>
                        </div>
                    </section>

                    <section className={`${styles.card} ${styles.pad}`} aria-labelledby="st-del">
                        <h2 id="st-del" className={styles.sectionTitle}>Delete account</h2>
                        <p className={`${styles.notice} ${styles.dangerBox}`}>
                            <Icon name="receipt" size={18} />
                            <span>This can’t be undone. Your profile details, photo, saved places and notifications are removed and you’re signed out everywhere. To keep a record of activity on the platform, ride events are kept <strong>without</strong> addresses or your identity (the addresses become “[removed]”).</span>
                        </p>
                        {!del.open ? (
                            <div className={styles.actions} style={{ marginTop: 'var(--sp-3)' }}>
                                <button type="button" className={styles.btnDanger} onClick={() => setDel((d) => ({ ...d, open: true }))}>Delete my account</button>
                            </div>
                        ) : (
                            <form className={styles.form} style={{ marginTop: 'var(--sp-3)' }} onSubmit={deleteAccount} noValidate>
                                {p.hasPassword ? (
                                    <div className={styles.field}>
                                        <label htmlFor="del-pw">Your password</label>
                                        <input id="del-pw" type="password" autoComplete="current-password" value={del.password} onChange={(e) => setDel((d) => ({ ...d, password: e.target.value }))} />
                                    </div>
                                ) : (
                                    <div className={styles.field}>
                                        <label htmlFor="del-email">Type your account email to confirm</label>
                                        <input id="del-email" type="email" autoComplete="off" placeholder={p.email} value={del.confirmEmail} onChange={(e) => setDel((d) => ({ ...d, confirmEmail: e.target.value }))} />
                                        <span className={styles.hint}>This account signs in with Google, so there is no password to check.</span>
                                    </div>
                                )}
                                <div className={styles.field}>
                                    <label htmlFor="del-conf">Type DELETE to confirm</label>
                                    <input id="del-conf" value={del.confirm} onChange={(e) => setDel((d) => ({ ...d, confirm: e.target.value }))} autoComplete="off" />
                                </div>
                                {delErr && <p className={styles.err} role="alert">{delErr}</p>}
                                <div className={styles.actions}>
                                    <button type="submit" className={styles.btnDanger} disabled={delBusy || !deleteReady}>{delBusy ? 'Deleting…' : 'Permanently delete account'}</button>
                                    <button type="button" className={styles.btnGhost} onClick={() => { setDel(CLOSED); setDelErr(''); }} disabled={delBusy}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </ProfileShell>
    );
}
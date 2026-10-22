import { useState } from 'react';
import Icon from '../../components/common/Icon';
import StateMessage from '../../components/admin/StateMessage';
import ProfileShell from './ProfileShell';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/accountService';
import { apiErrorMessage } from '../../utils/errors';
import styles from './Profile.module.css';

export default function Referral() {
    const toast = useToast();
    const { data, loading, error, reload } = useApi(() => accountService.referral());
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(data.code);
            toast.success('Code copied.');
        } catch {
            toast.error('Couldn’t copy automatically. Select the code and copy it.');
        }
    };
    const share = async () => {
        const link = `${window.location.origin}/signup?ref=${encodeURIComponent(data.code)}`;
        const text = `Join me on OUR and compare ride fares in one search. Sign up with my referral code ${data.code}: ${link}`;
        try {
            if (navigator.share) await navigator.share({ title: 'OUR referral', text });
            else { await navigator.clipboard.writeText(text); toast.success('Invite message copied.'); }
        } catch (e) {
            if (e?.name !== 'AbortError') toast.error('Sharing didn’t work. Try copying the code instead.');
        }
    };
    const apply = async (ev) => {
        ev.preventDefault();
        setBusy(true);
        setErr('');
        try {
            await accountService.applyReferral(code);
            toast.success('Referral code added.');
            setCode('');
            reload();
        } catch (e) {
            setErr(apiErrorMessage(e, 'We could not add that code.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <ProfileShell title="Refer & Earn" lead="Invite friends to OUR with your personal code.">
            <div className={styles.stack}>
                {error && <div className={styles.card}><StateMessage kind="error" title="Couldn’t load your referral code" onRetry={reload}>{error}</StateMessage></div>}
                {loading && !data && <div className={`${styles.card} ${styles.pad}`} role="status" aria-label="Loading" style={{ minHeight: 160 }} />}
                {data && (
                    <>
                        <div className={styles.codeBox}>
                            <div><p className={styles.sub}>Your referral code</p><p className={styles.code}>{data.code}</p></div>
                            <span className={styles.actions}>
                                <button type="button" className={styles.btnGhost} onClick={copy}>Copy code</button>
                                <button type="button" className={styles.btn} onClick={share}>Share</button>
                            </span>
                        </div>

                        <div className={styles.stats}>
                            <div><strong>{data.totals.total}</strong><span>Joined with your code</span></div>
                            <div><strong>{data.totals.qualified}</strong><span>Qualified</span></div>
                            <div><strong>{data.totals.pending}</strong><span>Pending</span></div>
                        </div>

                        <div className={`${styles.card} ${styles.pad}`}>
                            <h2 className={styles.sectionTitle}>How it works</h2>
                            <ol className={styles.bullets}>
                                <li>Share your code or invite link. A friend adds it when they sign up, or later under Refer &amp; Earn within {data.applyWindowDays} days of joining.</li>
                                <li>The referral counts as <strong>Qualified</strong> the next time they compare fares after the code is added.</li>
                                <li>Copying, sharing or opening the code never counts as a referral.</li>
                            </ol>
                            <p className={`${styles.notice} ${styles.warnBox}`} style={{ marginTop: 'var(--sp-3)' }}>
                                <Icon name="receipt" size={18} /><span>No rewards or payouts are offered yet, so none are promised. Referrals are tracked so that rewards can be added fairly later.</span>
                            </p>
                        </div>

                        <div className={`${styles.card} ${styles.pad}`}>
                            <h2 className={styles.sectionTitle}>Have a friend’s code?</h2>
                            {data.appliedCode ? (
                                <p className={styles.notice}><Icon name="check" size={18} /><span>You’ve added a referral code. Status: <strong>{data.appliedCode.status === 'QUALIFIED' ? 'Qualified' : 'Pending your next fare comparison'}</strong>.</span></p>
                            ) : data.canApply ? (
                                <form className={styles.form} onSubmit={apply}>
                                    <div className={styles.field}>
                                        <label htmlFor="ref-code">Referral code</label>
                                        <input id="ref-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} autoComplete="off" aria-invalid={Boolean(err)} />
                                        {err && <span className={styles.err} role="alert">{err}</span>}
                                    </div>
                                    <div className={styles.actions}><button type="submit" className={styles.btn} disabled={busy || code.trim().length < 4}>{busy ? 'Adding…' : 'Add code'}</button></div>
                                </form>
                            ) : (
                                <p className={styles.meta}>Referral codes can only be added within {data.applyWindowDays} days of signing up.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </ProfileShell>
    );
}
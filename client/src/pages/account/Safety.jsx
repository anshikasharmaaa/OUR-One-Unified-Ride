import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import ProfileShell from './ProfileShell';
import useApi from '../../hooks/useApi';
import { accountService } from '../../services/accountService';
import styles from './Profile.module.css';

const FIRST = [
    'Check the provider, vehicle and driver details shown in the provider’s own app before you get in.',
    'Share your trip with someone you trust using the provider’s trip-sharing feature.',
    'Use the provider’s official support for anything about a trip you booked with them.',
    'Don’t share more personal information than you need to.',
];
const CHECKS = [
    'The pickup and drop-off match what I meant to enter',
    'The provider app shows the vehicle and driver I expect',
    'Someone I trust knows where I’m going',
    'I know how to reach the provider’s support',
];

export default function Safety() {
    const { data } = useApi(() => accountService.profile());
    const [done, setDone] = useState({});
    const ec = data?.profile?.emergencyContact;

    return (
        <ProfileShell title="Safety" lead="Practical guidance for every trip. OUR compares options but does not run, verify or supervise provider drivers or vehicles.">
            <div className={styles.stack}>
                <section className={`${styles.card} ${styles.pad}`} aria-labelledby="sf-first">
                    <h2 id="sf-first" className={styles.sectionTitle}>Safety first</h2>
                    <ul className={styles.bullets}>{FIRST.map((t) => <li key={t}>{t}</li>)}</ul>
                </section>

                <section className={`${styles.card} ${styles.pad}`} aria-labelledby="sf-share">
                    <h2 id="sf-share" className={styles.sectionTitle}>Share live location</h2>
                    <p className={`${styles.notice} ${styles.warnBox}`}><Icon name="pin" size={18} /><span>Live location sharing isn’t available in OUR yet, so there’s no button for it. For trips booked with a provider, use that provider’s own trip-sharing feature.</span></p>
                </section>

                <section className={`${styles.card} ${styles.pad}`} aria-labelledby="sf-check">
                    <h2 id="sf-check" className={styles.sectionTitle}>Safety checks</h2>
                    <p className={styles.hint}>A checklist for you to tick before a ride. It isn’t saved and nothing is verified automatically.</p>
                    {CHECKS.map((c, i) => (
                        <label key={c} className={styles.check}>
                            <input type="checkbox" checked={Boolean(done[i])} onChange={(e) => setDone((d) => ({ ...d, [i]: e.target.checked }))} />
                            <span>{c}</span>
                        </label>
                    ))}
                </section>

                <section className={`${styles.card} ${styles.pad}`} aria-labelledby="sf-ec">
                    <h2 id="sf-ec" className={styles.sectionTitle}>Emergency contact</h2>
                    <p className={styles.meta}>
                        {ec ? <>{ec.name || 'Contact'} · <a href={`tel:+91${ec.phone}`}>+91 {ec.phone}</a></> : 'No emergency contact added yet.'}
                    </p>
                    <p className={`${styles.notice} ${styles.warnBox}`} style={{ margin: 'var(--sp-3) 0' }}>
                        <Icon name="receipt" size={18} />
                        <span>
                            OUR does not notify this person automatically and does not contact emergency services. The links here only open your phone’s dialler: you place the call yourself.
                            In an emergency in India, call <a href="tel:112"><strong>112</strong></a>.
                        </span>
                    </p>
                    <Link to="/profile/edit" className={styles.btnGhost}>{ec ? 'Change emergency contact' : 'Add emergency contact'}</Link>
                </section>

                <section className={`${styles.card} ${styles.pad}`} aria-labelledby="sf-report">
                    <h2 id="sf-report" className={styles.sectionTitle}>Report a problem</h2>
                    <p className={styles.meta} style={{ marginBottom: 'var(--sp-3)' }}>Send us a message about an issue with OUR. For a problem with a trip, contact the provider as well.</p>
                    <Link to="/contact" className={styles.btnGhost}>Contact us</Link>
                </section>
            </div>
        </ProfileShell>
    );
}
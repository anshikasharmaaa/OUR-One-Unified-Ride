import { useState } from 'react';
import { contactService } from '../../services/contactService';
import { apiErrorMessage } from '../../utils/errors';
import { CONTACT_EMAIL } from '../../config/site';
import styles from './ContactPage.module.css';

export const SUBJECTS = ['General question', 'Feedback', 'Collaboration', 'Report a problem', 'Other'];
const EMPTY = { name: '', organisation: '', phone: '', email: '', subject: '', message: '', website: '' };

function validate(v) {
    const e = {};
    if (v.name.trim().length < 2) e.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = 'Enter a valid email.';
    if (v.phone && !/^[0-9+\-\s]{7,20}$/.test(v.phone.trim())) e.phone = 'Enter a valid phone number.';
    if (!v.subject) e.subject = 'Choose a subject.';
    if (v.message.trim().length < 10) e.message = 'Please write at least 10 characters.';
    return e;
}

export default function ContactForm() {
    const [v, setV] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [state, setState] = useState({ status: 'idle', error: '', ticket: '' }); // idle | sending | done

    const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        const found = validate(v);
        setErrors(found);
        if (Object.keys(found).length) return;
        setState({ status: 'sending', error: '', ticket: '' });
        try {
            const res = await contactService.send(v);
            setState({ status: 'done', error: '', ticket: res?.data?.ticketId || '' });
            setV(EMPTY);
        } catch (err) {
            setState({ status: 'idle', error: apiErrorMessage(err, 'We could not send your message. Please try again.'), ticket: '' });
        }
    };

    if (state.status === 'done') {
        return (
            <div className={styles.done} role="status">
                <strong>Message sent</strong>
                <p>Thanks for writing to us. We’ll get back to you soon.{state.ticket && <> Your reference: <strong>{state.ticket}</strong>.</>}</p>
                <button type="button" className={styles.send} onClick={() => setState({ status: 'idle', error: '', ticket: '' })}>Send another message</button>
            </div>
        );
    }

    const field = (k, label, props = {}) => (
        <div className={styles.field}>
            <label htmlFor={`c-${k}`}>{label}</label>
            <input id={`c-${k}`} value={v[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `c-${k}-err` : undefined} {...props} />
            {errors[k] && <span id={`c-${k}-err`} className={styles.err}>{errors[k]}</span>}
        </div>
    );

    return (
        <form onSubmit={submit} noValidate className={styles.formGrid} aria-busy={state.status === 'sending' || undefined}>
            {field('name', 'Name', { placeholder: 'Your name', autoComplete: 'name', maxLength: 80 })}
            {field('organisation', 'Organisation (optional)', { placeholder: 'College or company', autoComplete: 'organization', maxLength: 80 })}
            {field('phone', 'Phone (optional)', { placeholder: 'Phone number', type: 'tel', autoComplete: 'tel', maxLength: 20 })}
            {field('email', 'Email', { placeholder: 'you@example.com', type: 'email', autoComplete: 'email', maxLength: 254 })}
            <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="c-subject">Subject</label>
                <select id="c-subject" value={v.subject} onChange={set('subject')} aria-invalid={Boolean(errors.subject)}>
                    <option value="">Select a subject</option>
                    {SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                {errors.subject && <span className={styles.err}>{errors.subject}</span>}
            </div>
            <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="c-message">Message</label>
                <textarea id="c-message" rows={5} value={v.message} onChange={set('message')} placeholder="How can we help?" maxLength={1500} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'c-message-err' : undefined} />
                {errors.message && <span id="c-message-err" className={styles.err}>{errors.message}</span>}
            </div>
            {/* Honeypot: hidden from people and assistive tech */}
            <div className={styles.trap} aria-hidden="true">
                <label htmlFor="c-website">Website</label>
                <input id="c-website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} />
            </div>
            {state.error && (
                <p className={`${styles.full} ${styles.formErr}`} role="alert">
                    {state.error}
                    {CONTACT_EMAIL && <> You can also email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</>}
                </p>
            )}
            <button type="submit" className={`${styles.send} ${styles.full}`} disabled={state.status === 'sending'}>
                {state.status === 'sending' ? 'Sending…' : 'Send'}
            </button>
        </form>
    );
}
import { Helmet } from 'react-helmet-async';
import Icon from '../../components/common/Icon';
import { CONTACT_EMAIL } from '../../config/site';
import ContactForm from './ContactForm';
import styles from './ContactPage.module.css';

// Fill in the details you want shown. Anything left empty is hidden.
const DETAILS = { address: '', email: CONTACT_EMAIL, phone: '' };

const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
);

const TOPICS = [
    { icon: 'mail', title: 'Questions about OUR', text: 'How the comparison works, what is supported, and what is planned.' },
    { icon: 'star', title: 'Feedback & ideas', text: 'Tell us what would make choosing a ride easier for you.' },
    { icon: 'users', title: 'Collaboration', text: 'Interested in working with the OUR team? We’d like to hear from you.' },
];

export default function ContactPage() {
    const rows = [
        DETAILS.address && { key: 'address', icon: <Icon name="pin" size={20} />, title: 'Address', text: DETAILS.address },
        DETAILS.email && { key: 'email', icon: <Icon name="mail" size={20} />, title: 'Email us', text: DETAILS.email, href: `mailto:${DETAILS.email}` },
        DETAILS.phone && { key: 'phone', icon: <PhoneIcon />, title: 'Call us', text: DETAILS.phone, href: `tel:${DETAILS.phone.replace(/\s/g, '')}` },
    ].filter(Boolean);

    return (
        <>
            <Helmet>
                <title>Contact · OUR</title>
                <meta name="description" content="Get in touch with the OUR (One Unified Ride) team." />
            </Helmet>

            <section className={styles.hero} aria-labelledby="contact-title">
                <div className={`container ${styles.heroInner}`}>
                    <h1 id="contact-title" className={styles.h1}>Contact us</h1>
                    <p className={styles.lead}>OUR is ready to listen. Send us a question, an idea or some feedback and we’ll get back to you.</p>
                </div>
            </section>

            <section className={`container ${styles.wrap}`} aria-label="Contact OUR">
                <div className={styles.card}>
                    <aside className={styles.info}>
                        <h2 className={styles.infoTitle}>Get in touch</h2>
                        <p className={styles.infoLead}>Here’s what you can write to us about.</p>
                        <ul className={styles.topics}>
                            {rows.map((r) => (
                                <li key={r.key}>
                                    <span className={styles.topicIcon} aria-hidden="true">{r.icon}</span>
                                    <div><strong>{r.title}</strong>{r.href ? <a href={r.href}>{r.text}</a> : <span>{r.text}</span>}</div>
                                </li>
                            ))}
                            {TOPICS.map((t) => (
                                <li key={t.title}>
                                    <span className={styles.topicIcon} aria-hidden="true"><Icon name={t.icon} size={20} /></span>
                                    <div><strong>{t.title}</strong><span>{t.text}</span></div>
                                </li>
                            ))}
                        </ul>
                    </aside>
                    <div className={styles.formPane}>
                        <h2 className={styles.formTitle}>Send us a message</h2>
                        <ContactForm />
                    </div>
                </div>
            </section>
        </>
    );
}
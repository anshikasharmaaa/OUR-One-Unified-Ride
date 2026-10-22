import { useState } from 'react';
import Section from './Section';
import styles from './Faq.module.css';

export const FAQS = [
  { q: 'What is OUR?', a: 'OUR — One Unified Ride — is a ride-comparison platform. The idea is to let you enter a trip once and see your ride options in one place instead of checking several apps.' },
  { q: 'Are the fares on OUR exact?', a: 'No. Any fare shown by OUR is an estimate to help you compare. The final price is decided by the ride provider and can differ because of traffic, demand, tolls or route changes. OUR does not show made-up fares.' },
  { q: 'Can I compare rides right now?', a: 'Live fare comparison across providers is still in development. Today you can submit a search and create an account; we will say so clearly when comparisons go live.' },
  { q: 'Which providers does OUR compare?', a: 'Provider connections are being built, so we are not listing any yet. OUR does not operate rides itself, and we will only name providers once those connections genuinely work.' },
  { q: 'How do I use OUR?', a: 'Enter your pickup and drop-off, optionally choose a ride type, and press Compare rides. Creating a free account lets you sign in with email or Google.' },
  { q: 'Which cities does OUR cover?', a: 'OUR is being built first for commuters in Madhya Pradesh, with more Tier-2 cities planned later.' },
  { q: 'What happens to the places I search for?', a: 'When you submit a search, the pickup, drop-off and ride type are recorded so the OUR team can understand demand and improve the service. If you are signed in, the search is linked to your account. Search records are deleted automatically after 180 days.' },
];

export default function Faq() {
  const [open, setOpen] = useState(0); // one answer open at a time
  return (
    <Section id="faq" tone="soft">
      <div className={styles.head}>
        <p className={styles.eyebrow}>Help / FAQs</p>
        <h2 id="faq-title" className={styles.title}>Common Questions</h2>
      </div>
      <div className={styles.list}>
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={f.q} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
              <h3>
                <button type="button" id={`faq-btn-${i}`} aria-expanded={isOpen} aria-controls={`faq-panel-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className={styles.no}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={styles.q}>{f.q}</span>
                  <span className={styles.btn} aria-hidden="true" />
                </button>
              </h3>
              <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} hidden={!isOpen} className={styles.panel}>
                <p>{f.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
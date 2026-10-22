import { Helmet } from 'react-helmet-async';
import Icon from '../../components/common/Icon';
import ParticleCanvas from '../../components/common/ParticleCanvas';
import PromiseBar from '../../components/common/PromiseBar';
import { AVAILABLE_TODAY, CAPABILITIES, PHASES } from './roadmapData';
import styles from './Upcoming.module.css';

const pad = (n) => String(n + 1).padStart(2, '0');

export default function UpcomingPage() {
    return (
        <>
            <Helmet>
                <title>Upcoming · OUR</title>
                <meta name="description" content="The planned roadmap for OUR (One Unified Ride): city expansion, fare insights and more. Plans, not live features." />
            </Helmet>

            <section className={styles.hero} aria-labelledby="up-title">
                <ParticleCanvas className={styles.canvas} />
                <div className={`container ${styles.heroInner}`}>
                    <p className={styles.eyebrow}>Roadmap</p>
                    <h1 id="up-title" className={styles.title}>What’s coming to OUR</h1>
                    <p className={styles.lead}>
                        OUR is a neutral place to compare ride options from providers such as Ola, Uber and Rapido.
                        Our plan is to make that comparison available in more Tier-2 cities, clearer about where every number comes from, and more useful for everyday journeys.
                    </p>
                    <p className={styles.disclaimer}>
                        <span className={styles.dot} aria-hidden="true" />
                        Everything below is planned work. It is not live, and it is not a promise of dates or partnerships.
                    </p>
                </div>
            </section>

            {/* ---------- Available today ---------- */}
            <section className={`container ${styles.section}`} aria-labelledby="today-title">
                <header className={styles.head}>
                    <p className={styles.kicker}>Live now</p>
                    <h2 id="today-title" className={styles.h2}>Available today</h2>
                    <p className={styles.sectionLead}>What you can use right now, before any of the plans below.</p>
                </header>
                <ul className={styles.todayGrid}>
                    {AVAILABLE_TODAY.map((t, i) => (
                        <li key={t.title} className={styles.todayItem}>
                            <span className={styles.todayNum} aria-hidden="true">{pad(i)}</span>
                            <span className={styles.todayIcon} aria-hidden="true"><Icon name={t.icon} size={24} /></span>
                            <span className={`${styles.pill} ${styles.live}`}><span className={styles.pulse} aria-hidden="true" />Available now</span>
                            <h3 className={styles.h3}>{t.title}</h3>
                            <p className={styles.text}>{t.text}</p>
                        </li>
                    ))}
                </ul>
            </section>

            {/* ---------- Planned capabilities ---------- */}
            <section className={`container ${styles.section}`} aria-labelledby="plans-title">
                <header className={styles.head}>
                    <p className={styles.kicker}>On the roadmap</p>
                    <h2 id="plans-title" className={styles.h2}>Planned capabilities</h2>
                    <p className={styles.sectionLead}>Directions we intend to explore. None of these are available yet.</p>
                </header>
                <ul className={styles.cards}>
                    {CAPABILITIES.map((c, i) => (
                        <li key={c.id} className={styles.card}>
                            <span className={styles.cardNum} aria-hidden="true">{pad(i)}</span>
                            <div className={styles.cardTop}>
                                <span className={styles.icon} aria-hidden="true"><Icon name={c.icon} size={24} /></span>
                                <span className={`${styles.pill} ${c.status === 'Planned' ? styles.planned : styles.exploring}`}>{c.status}</span>
                            </div>
                            <h3 className={styles.h3}>{c.title}</h3>
                            <p className={styles.text}>{c.summary}</p>
                            <ul className={styles.points}>
                                {c.points.map((p) => (
                                    <li key={p}><span className={styles.tick} aria-hidden="true"><Icon name="check" size={12} /></span>{p}</li>
                                ))}
                            </ul>
                            {c.note && <p className={styles.note}>{c.note}</p>}
                        </li>
                    ))}
                </ul>
            </section>

            {/* ---------- Expansion strategy ---------- */}
            <section className={styles.band} aria-labelledby="phases-title">
                <div className={`container ${styles.bandInner}`}>
                    <header className={styles.head}>
                        <p className={`${styles.kicker} ${styles.kickerLight}`}>Expansion strategy</p>
                        <h2 id="phases-title" className={`${styles.h2} ${styles.onDark}`}>From a strong core to smarter insights</h2>
                        <p className={`${styles.sectionLead} ${styles.onDarkMuted}`}>
                            A proposed sequence, not a record of completed work. Each phase starts only when the one before it has been validated.
                        </p>
                    </header>
                    <ol className={styles.timeline}>
                        {PHASES.map((p, i) => (
                            <li key={p.id} className={styles.phase}>
                                <span className={styles.node} aria-hidden="true">{i + 1}</span>
                                <div className={styles.phaseCard}>
                                    <span className={styles.phaseLabel}>{p.label}</span>
                                    <h3 className={`${styles.h3} ${styles.onDark}`}>{p.title}</h3>
                                    <ul className={`${styles.points} ${styles.pointsDark}`}>
                                        {p.points.map((x) => <li key={x}><span className={styles.tickDark} aria-hidden="true" />{x}</li>)}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <PromiseBar title="See what works today" text="Compare ride options between two places on the home page." to="/" cta="Go to ride search" />
        </>
    );
}
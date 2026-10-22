import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Icon from '../../components/common/Icon';
import PromiseBar from '../../components/common/PromiseBar';
import useReducedMotion from '../../hooks/useReducedMotion';
import page from '../common/Page.module.css';
import styles from './Explore.module.css';

const RIDES = [
    { icon: 'bike', title: 'Bike Rides', text: 'A convenient option for solo commuters looking for quick, budget-friendly travel.' },
    { icon: 'auto', title: 'Auto Rides', text: 'A practical choice for short-distance journeys and everyday city travel.' },
    { icon: 'car', title: 'Economy Cabs', text: 'Explore comfortable rides for daily commutes, shopping trips, and city journeys.' },
    { icon: 'star', title: 'Premium Cabs', text: 'Discover higher-comfort options when you want a more premium travel experience.' },
];

const STEPS = [
    { icon: 'receipt', title: 'Compare Fares', text: 'Review estimated fares across supported ride providers before deciding.' },
    { icon: 'activity', title: 'Check Ride Availability', text: 'Explore the availability information provided by supported integrations.' },
    { icon: 'target', title: 'Choose Your Priority', text: 'Looking for a lower estimated fare, a quicker pickup, or more comfort? Compare available details and choose what matters most to you.' },
    { icon: 'external', title: 'Continue with Your Chosen Provider', text: 'Once you’ve selected an option, continue to the respective service provider to complete your booking.' },
];

function Node({ x, y, label }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r="20" className={styles.ring} />
            <circle r="9" className={styles.ringIn} />
            <circle r="3.5" fill="#fff" />
            <g transform="translate(-34 -52)">
                <path d="M0 0h-6v22h6M68 0h6v22h-6" className={styles.bracket} />
                <text x="34" y="15" textAnchor="middle" className={styles.nodeText}>{label}</text>
            </g>
        </g>
    );
}

function RouteMap() {
    return (
        <svg className={styles.mapBg} viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <defs>
                <pattern id="ex-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                    <path d="M48 0H0v48" fill="none" stroke="rgba(120,160,255,.10)" strokeWidth="1" />
                </pattern>
                <linearGradient id="ex-route" x1="0" x2="1">
                    <stop offset="0" stopColor="#2f7bff" />
                    <stop offset="1" stopColor="#38d6ff" />
                </linearGradient>
            </defs>
            <rect width="1200" height="520" fill="url(#ex-grid)" />
            <path d="M440 520 C 520 430, 600 470, 700 400 S 900 380, 1200 440 L1200 520Z" fill="rgba(47,123,255,.12)" />
            <path d="M600 0 C 640 90, 560 150, 640 230 S 760 300, 700 400" fill="none" stroke="rgba(120,160,255,.16)" strokeWidth="14" strokeLinecap="round" />
            <path d="M720 330 C 780 360, 830 400, 870 410 M870 300 C 940 330, 990 320, 1030 300" className={styles.dots} />
            <path d="M540 410 C 620 380, 650 300, 720 292 S 860 262, 930 190" className={styles.routeMain} />
            <path d="M720 292 L720 330 M930 190 L960 300" className={styles.dots} />
            <path d="M930 190 C 880 230, 880 300, 870 410" className={styles.dots} />
            <Node x={720} y={330} label="Ola" />
            <Node x={870} y={410} label="Uber" />
            <Node x={1030} y={300} label="Rapido" />
            <g transform="translate(930 190)">
                <circle r="26" className={styles.ring} />
                <path d="M0 0C-12-14-20-24-20-35a20 20 0 0 1 40 0c0 11-8 21-20 35Z" transform="translate(0 -8) scale(1.1)" fill="#fff" />
                <circle cy="-48" r="7" fill="#1d4ed8" />
            </g>
        </svg>
    );
}

export default function ExplorePage() {
    const reduced = useReducedMotion();
    const [idx, setIdx] = useState(0);
    const track = useRef(null);
    const n = RIDES.length;
    const go = (d) => setIdx((v) => (v + d + n) % n);
    const offset = (i) => ((i - idx + n + 1) % n) - 1; // -1, 0, 1, 2 (2 = hidden)
    const slide = (dir) => {
        const el = track.current;
        if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 560), behavior: reduced ? 'auto' : 'smooth' });
    };

    return (
        <>
            <Helmet>
                <title>Explore · OUR</title>
                <meta name="description" content="Explore ride options across Ola, Uber and Rapido, compare estimated fares and choose the best fit for your journey." />
            </Helmet>

            {/* Hero: dark route map */}
            <section className={styles.hero} aria-labelledby="explore-title">
                <RouteMap />
                <div className={`container ${styles.heroInner}`}>
                    <p className={styles.eyebrow}>Explore OUR</p>
                    <h1 id="explore-title" className={styles.h1}>Discover More. <span>Compare Smarter. Travel Better.</span></h1>
                    <p className={styles.lead}>Your journey starts with choices. Explore ride options across Ola, Uber, and Rapido, discover the best fit for your travel needs, and make informed decisions, all from one place.</p>
                    <Link to="/" className={styles.heroCta}>Compare Rides Now <Icon name="arrowRight" size={18} /></Link>
                </div>
            </section>

            {/* 3D card carousel */}
            <section className={styles.stage} aria-labelledby="rides-title" onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); }}>
                <div className={`container ${styles.stageInner}`}>
                    <h2 id="rides-title" className={styles.stageTitle}>Find Your Perfect Ride</h2>
                    <ul className={styles.deck}>
                        {RIDES.map((r, i) => {
                            const o = offset(i);
                            const cls = o === 0 ? styles.c0 : o === -1 ? styles.cL : o === 1 ? styles.cR : styles.cX;
                            return (
                                <li key={r.title} className={`${styles.card} ${cls}`} aria-hidden={o !== 0} onClick={() => o !== 0 && setIdx(i)}>
                                    <span className={styles.cardIcon} aria-hidden="true"><Icon name={r.icon} size={34} /></span>
                                    <p className={styles.cardKicker}>Ride category</p>
                                    <h3 className={styles.cardTitle}>{r.title}</h3>
                                    <p className={styles.cardText}>{r.text}</p>
                                    <span className={styles.cardFoot}>Compared across Ola, Uber and Rapido</span>
                                </li>
                            );
                        })}
                    </ul>
                    <p className="visually-hidden" aria-live="polite">{RIDES[idx].title}: {RIDES[idx].text}</p>
                    <div className={styles.controls}>
                        <button type="button" className={styles.ctl} onClick={() => go(-1)}><Icon name="chevronLeft" size={16} />Previous</button>
                        <button type="button" className={styles.ctl} onClick={() => go(1)}>Next<Icon name="chevronRight" size={16} /></button>
                    </div>
                    <div className={styles.dotsRow} role="group" aria-label="Choose ride category">
                        {RIDES.map((r, i) => (<button key={r.title} type="button" aria-label={r.title} aria-pressed={i === idx} className={`${styles.dot} ${i === idx ? styles.dotOn : ''}`} onClick={() => setIdx(i)} />))}
                    </div>
                </div>
            </section>

            {/* How you decide */}
            <section className={styles.decide} aria-labelledby="options-title">
                <div className={`container ${styles.decideInner}`}>
                    <header className={styles.decideHead}>
                        <div>
                            <p className={page.tag}>How you decide</p>
                            <h2 id="options-title" className={page.h2}>Explore Your Options</h2>
                        </div>
                        <div className={styles.arrows}>
                            <button type="button" className={styles.arrow} onClick={() => slide(-1)} aria-label="Scroll steps back"><Icon name="chevronLeft" size={20} /></button>
                            <button type="button" className={styles.arrow} onClick={() => slide(1)} aria-label="Scroll steps forward"><Icon name="chevronRight" size={20} /></button>
                        </div>
                    </header>
                    <ol className={styles.track} ref={track} tabIndex={0} aria-label="Steps for choosing a ride">
                        {STEPS.map((s, i) => (
                            <li key={s.title} className={styles.slide}>
                                <div className={styles.slideText}>
                                    <span className={styles.slideNo}>Step {i + 1}</span>
                                    <p>{s.text}</p>
                                    <footer><strong>{s.title}</strong><small>Step {i + 1} of {STEPS.length}</small></footer>
                                </div>
                                <div className={styles.slideArt} aria-hidden="true"><Icon name={s.icon} size={44} /></div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <PromiseBar title="Your Destination. Your Decision." text="Stop switching between apps just to compare your options. OUR — One Search, Infinite Choices." to="/" cta="Compare Rides Now" />
        </>
    );
}
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Icon from '../../components/common/Icon';
import PromiseBar from '../../components/common/PromiseBar';
import page from '../common/Page.module.css';
import styles from './About.module.css';

const STORY = [
    { title: 'The everyday dilemma', text: 'Which app offers the better ride for this journey?' },
    { title: 'Apps take time', text: 'Checking multiple platforms one by one takes time.' },
    { title: 'Details differ', text: 'Prices and availability can change with route, vehicle type, demand and time of travel.' },
    { title: 'One place', text: 'OUR brings ride comparison into one experience. Not to replace ride-hailing services, but to make choosing between them easier.', hi: true },
];

const FACTS = [
    { n: '1', title: 'One search', text: 'Enter your pickup and drop once and see your options together.' },
    { n: '3', title: 'Three providers', text: 'Ola, Uber and Rapido, compared side by side where data is supported.' },
    { n: '4', title: 'Four ride categories', text: 'Bike, auto, economy cab and premium cab.' },
];

const VALUES = [
    { icon: 'layers', label: 'One search' },
    { icon: 'receipt', label: 'Transparent estimates' },
    { icon: 'compass', label: 'Neutral comparison' },
    { icon: 'user', label: 'Your control' },
];

const DIFFERENT = [
    { icon: 'search', title: 'One search, multiple choices', text: 'Ola, Uber and Rapido without checking each one.' },
    { icon: 'receipt', title: 'Compare before you ride', text: 'Fare estimates and ride details up front.' },
    { icon: 'target', title: 'Choose what works for you', text: 'Price, convenience or pickup time, your call.' },
    { icon: 'users', title: 'Built for everyday commuters', text: 'Students, professionals, daily commuters, travellers.' },
    { icon: 'check', title: 'Your decision, your control', text: 'You book with the provider you choose.' },
];

const FLOW = ['Publicly available information', 'Supported fare estimates', 'Relevant ride options', 'Your comparison', 'Booking completed with the provider'];

const TEAM = [
    { name: 'Anshika Sharma', role: 'Co-Founder & Project Lead', photo: '/team/anshika.jpg', bio: 'Focused on product development, technology, user experience, and building a practical mobility comparison solution.' },
    { name: 'Harshit Singh', role: 'Co-Founder', photo: '/team/harshit.jpg', bio: 'Contributing to the development and advancement of the OUR vision.' },
];

function Pin({ x, y, label, you }) {
    const w = label.length * 7 + 20;
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse cy="2" rx="9" ry="3.5" className={styles.pinShadow} />
            <path d="M0 0C-12-13-19-23-19-33a19 19 0 0 1 38 0c0 10-7 20-19 33Z" className={you ? styles.pinYou : styles.pin} />
            <circle cy="-33" r="7" className={styles.pinDot} />
            <rect x={-w / 2} y="-78" width={w} height="24" rx="12" className={styles.chip} />
            <text y="-62" textAnchor="middle" className={styles.chipText}>{label}</text>
        </g>
    );
}

function RideMap() {
    return (
        <svg className={styles.map} viewBox="0 0 520 400" role="img" aria-label="Illustration: one search fanning out to Ola, Uber and Rapido">
            <path className={styles.land} d="M90 80 L170 48 L262 62 L332 44 L402 96 L432 172 L392 252 L332 304 L272 346 L222 304 L160 274 L100 224 L70 150Z" />
            <path className={styles.border} d="M170 48 L190 150 L262 190 M332 44 L300 130 L392 252 M222 304 L250 230 L190 150" />
            <path className={styles.route} d="M120 300 C 170 250, 200 190, 250 168" />
            <path className={styles.route} d="M120 300 C 200 320, 270 300, 340 262" />
            <path className={styles.route} d="M120 300 C 220 240, 330 190, 400 138" />
            <Pin x={250} y={168} label="Ola" />
            <Pin x={340} y={262} label="Uber" />
            <Pin x={400} y={138} label="Rapido" />
            <Pin x={120} y={300} label="Your search" you />
        </svg>
    );
}

export default function AboutPage() {
    const [i, setI] = useState(0);
    const m = TEAM[i];
    const step = (dir) => setI((v) => (v + dir + TEAM.length) % TEAM.length);

    return (
        <>
            <Helmet>
                <title>About · OUR</title>
                <meta name="description" content="OUR (One Unified Ride) is a neutral ride comparison platform that helps commuters make informed travel decisions." />
            </Helmet>

            {/* Hero with map */}
            <section className={styles.hero} aria-labelledby="about-title">
                <div className={`container ${styles.heroInner}`}>
                    <div>
                        <p className={styles.eyebrow}>About OUR</p>
                        <h1 id="about-title" className={styles.h1}>One Search, <em className={styles.accent}>Infinite Choices.</em></h1>
                        <p className={styles.lead}>Your journey. Your choices. Your ride. Choosing a ride should be easier, smarter, and more transparent.</p>
                        <p className={styles.note}>
                            Ride-hailing platforms offer different prices, estimated arrival times and vehicle options for the same journey. Comparing them one by one takes time, so OUR brings these choices together in one place.
                        </p>
                    </div>
                    <div className={styles.mapCard}>
                        <RideMap />
                    </div>
                </div>
            </section>

            {/* Why we started */}
            <section className={`container ${page.section}`} aria-labelledby="story-title">
                <header className={page.head}>
                    <p className={page.tag}>Our story</p>
                    <h2 id="story-title" className={page.h2}>Why we started OUR</h2>
                </header>
                <ol className={styles.steps}>
                    {STORY.map((s, n) => (
                        <li key={s.title} className={`${styles.step} ${s.hi ? styles.stepHi : ''}`}>
                            <h3 className={styles.stepTitle}>{s.title}</h3>
                            <p className={styles.stepText}>{s.text}</p>
                            <span className={styles.stepNo}>STEP 0{n + 1}</span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* What OUR brings together */}
            <section className={`container ${page.section}`} aria-labelledby="facts-title">
                <header className={page.head}>
                    <p className={page.tag}>At a glance</p>
                    <h2 id="facts-title" className={page.h2}>What OUR brings together</h2>
                </header>
                <ul className={styles.facts}>
                    {FACTS.map((f) => (
                        <li key={f.title} className={styles.fact}>
                            <div>
                                <h3 className={styles.factTitle}>{f.title}</h3>
                                <span className={page.rule} />
                                <p className={styles.factText}>{f.text}</p>
                            </div>
                            <span className={styles.numeral} aria-hidden="true">{f.n}</span>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Mission & vision */}
            <section className={`container ${page.section}`} aria-labelledby="mv-title">
                <div className={styles.mv}>
                    <div className={styles.mvHead}>
                        <h2 id="mv-title" className={styles.mvTitle}>Our Mission<br />&amp; Vision</h2>
                        <span className={styles.mvRule} />
                    </div>
                    <article className={styles.bar}>
                        <span className={`${styles.disc} ${styles.discA}`} aria-hidden="true"><Icon name="target" size={44} /></span>
                        <div>
                            <h3 className={styles.barTitle}>Mission</h3>
                            <p className={styles.barText}>To make everyday urban mobility simpler and more transparent by bringing ride options together on a single comparison platform, helping commuters decide by budget, convenience, estimated arrival time and travel preferences.</p>
                        </div>
                    </article>
                    <article className={`${styles.bar} ${styles.barB}`}>
                        <span className={`${styles.disc} ${styles.discB}`} aria-hidden="true"><Icon name="compass" size={44} /></span>
                        <div>
                            <h3 className={styles.barTitle}>Vision</h3>
                            <p className={styles.barText}>To become a trusted mobility decision platform that empowers people to travel smarter, starting with India’s Tier 2 and Tier 3 cities and expanding to urban communities across the country, where comparing rides is as simple as searching for a destination.</p>
                        </div>
                    </article>
                </div>
                <ul className={styles.chips} aria-label="Our values">
                    {VALUES.map((v) => (<li key={v.label}><Icon name={v.icon} size={18} />{v.label}</li>))}
                </ul>
            </section>

            {/* Different + approach, combined */}
            <section className="container" aria-labelledby="diff-title">
                <div className={styles.duo}>
                    <div>
                        <p className={page.tag}>What makes OUR different</p>
                        <h2 id="diff-title" className={page.h2}>Built around your decision</h2>
                        <p className={page.text}>OUR is a neutral comparison and decision-support platform. You stay in control of your ride choice and proceed to the provider you pick to complete your booking.</p>
                    </div>
                    <ul className={styles.pills}>
                        {DIFFERENT.map((d) => (
                            <li key={d.title} className={styles.pill}>
                                <span className={styles.pillIcon} aria-hidden="true"><Icon name={d.icon} size={20} /></span>
                                <div><strong>{d.title}</strong><span>{d.text}</span></div>
                                <span className={styles.tickEnd} aria-hidden="true"><Icon name="check" size={13} /></span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={`${styles.duo} ${styles.duoFlip}`}>
                    <ol className={styles.flow} aria-label="How OUR builds a comparison">
                        {FLOW.map((f, n) => (<li key={f} className={n === FLOW.length - 1 ? styles.flowEnd : ''}>{f}</li>))}
                    </ol>
                    <div>
                        <p className={page.tag}>Our approach</p>
                        <h2 className={page.h2}>Better decisions begin with better information</h2>
                        <p className={page.text}>OUR brings together publicly available information, supported fare estimates and relevant ride options through a simple interface. Where supported integrations are available, we aim to improve the accuracy and usefulness of comparisons while directing you to the provider for booking.</p>
                        <p className={styles.disclaimer}>
                            <Icon name="receipt" size={18} />
                            Fare estimates, availability, and arrival times may vary from the final details shown by the service provider.
                        </p>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className={styles.team} aria-labelledby="team-title">
                <div className={`container ${styles.teamInner}`}>
                    <header className={page.head}>
                        <p className={page.tag}>Meet the team</p>
                        <h2 id="team-title" className={page.h2}>Building a smarter way to move</h2>
                        <p className={page.text}>A team passionate about technology, innovation and solving everyday problems through practical digital solutions.</p>
                    </header>
                    <div className={styles.feature} key={m.name}>
                        <div>
                            <h3 className={styles.name}>{m.name}</h3>
                            <p className={styles.role}>{m.role}</p>
                            <p className={styles.bio}>{m.bio}</p>
                            <div className={styles.arrows}>
                                <button type="button" className={styles.arrow} onClick={() => step(-1)} aria-label="Previous team member"><Icon name="chevronLeft" size={20} /></button>
                                <button type="button" className={styles.arrow} onClick={() => step(1)} aria-label="Next team member"><Icon name="chevronRight" size={20} /></button>
                            </div>
                        </div>
                        <figure className={styles.photo}>
                            <img src={m.photo} alt={m.name} width="800" height="1000" loading="lazy" decoding="async" />
                        </figure>
                    </div>
                    <ul className={styles.strip} aria-label="Team members">
                        {TEAM.map((t, n) => (
                            <li key={t.name}>
                                <button type="button" className={`${styles.thumb} ${n === i ? styles.thumbOn : ''}`} aria-pressed={n === i} onClick={() => setI(n)}>
                                    <img src={t.photo} alt="" width="56" height="56" loading="lazy" decoding="async" />
                                    <span><strong>{t.name}</strong><small>{t.role}</small></span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <PromiseBar title="Compare Smarter. Travel Better." text="We want every user to spend less time comparing apps and more time getting where they need to go. Explore your options. Make your choice. Own your journey." to="/" cta="Start your journey" />
        </>
    );
}
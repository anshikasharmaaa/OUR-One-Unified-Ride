import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Icon from '../../components/common/Icon';
import Reveal from '../../components/common/Reveal';
import ScrollWords from '../../components/common/ScrollWords';
import useReducedMotion from '../../hooks/useReducedMotion';
import { OPPORTUNITY, COMPARE, FLOW, REWA_POINTS, UNION_STAGES, JOURNEY, ROADMAP } from './oursData';
import styles from './Ours.module.css';

const STAGE_ICONS = ['users', 'mail', 'compass', 'receipt', 'check'];
const ROAD_ICONS = ['target', 'chart', 'layers', 'compass'];
const WAVE = 'M0 150 H125 C250 150 250 50 375 50 C500 50 500 160 625 160 C750 160 750 70 875 70 H1000';
const WAVE_Y = [150, 50, 160, 70];

function Head({ tag, title, id, center, children }) {
    return (
        <header className={`${styles.head} ${center ? styles.headC : ''}`}>
            <Reveal as="p" className={styles.tag}>{tag}</Reveal>
            <ScrollWords as="h2" id={id} className={styles.h2} text={title} />
            {children && <Reveal as="p" delay={100} className={styles.text}>{children}</Reveal>}
        </header>
    );
}

export default function OursPage() {
    const reduced = useReducedMotion();
    const [stage, setStage] = useState(0);
    const [active, setActive] = useState(0);
    const rows = useRef([]);
    const o = OPPORTUNITY;

    // Highlights the journey row that sits in the middle of the screen.
    useEffect(() => {
        if (reduced || !('IntersectionObserver' in window)) return undefined;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) setActive(Number(e.target.dataset.i)); });
        }, { rootMargin: '-45% 0px -45% 0px' });
        rows.current.forEach((el) => el && io.observe(el));
        return () => io.disconnect();
    }, [reduced]);

    const toOpportunity = () => document.getElementById('opportunity')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });

    return (
        <>
            <Helmet>
                <title>OUR’S · Local mobility, planned for Tier-3 cities · OUR</title>
                <meta name="description" content="OUR’S is a planned local ride-booking platform for Tier-3 cities, with Rewa, Madhya Pradesh as the planned first city. Not yet operating." />
            </Helmet>

            {/* ---------- Hero ---------- */}
            <section className={styles.heroWrap} aria-labelledby="ours-title">
                <div className="container">
                    <div className={styles.heroCard}>
                        <div className={styles.heroBg} aria-hidden="true" />
                        <div className={styles.heroInner}>
                            <h1 id="ours-title" className={styles.h1}>
                                <span className={styles.brand}>OUR<em>’S</em></span>
                                <span className={styles.headline}>Local Mobility, <b>Reimagined</b> for the Next Tier of India.</span>
                            </h1>
                            <p className={styles.lead}>
                                OUR’S is being developed as a local ride-booking platform designed around the mobility needs of Tier-3 cities, beginning with a planned launch in Rewa, Madhya Pradesh.
                            </p>
                            <div className={styles.ctas}>
                                <button type="button" className={styles.primary} onClick={toOpportunity}>Discover OUR’S <Icon name="arrowRight" size={18} /></button>
                                <Link to="/" className={styles.ghost}>Compare rides on OUR</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- Statement ---------- */}
            <section className={`container ${styles.statement}`}>
                <ScrollWords as="p" className={styles.big} text="OUR’S is being designed as a local ride-booking platform for Tier-3 cities, built around short trips, transparent pricing and the people who already know the local roads." />
            </section>

            {/* ---------- A. Opportunity (bento) ---------- */}
            <section id="opportunity" className={`container ${styles.sec} ${styles.anchor}`} aria-labelledby="opp-title">
                <div className={styles.bento}>
                    <Reveal className={`${styles.tile} ${styles.tArt}`}>
                        <span className={styles.shape} aria-hidden="true"><Icon name={o[0].icon} size={32} /></span>
                        <h3 className={styles.tTitle}>{o[0].title}</h3>
                        <p className={styles.tText}>{o[0].text}</p>
                    </Reveal>
                    <Reveal delay={80} className={`${styles.tile} ${styles.tHead}`}>
                        <p className={styles.tag}>The opportunity</p>
                        <ScrollWords as="h2" id="opp-title" className={styles.h2} text="Built for how smaller cities move" />
                        <p className={styles.text}>OUR’S is being designed around the everyday transport needs of Tier-3 cities. These are the problems and opportunities it aims to address, not market statistics.</p>
                    </Reveal>
                    <Reveal delay={160} zoom className={`${styles.tile} ${styles.tImgTall}`}><div className={styles.img1} aria-hidden="true" /></Reveal>
                    <Reveal zoom className={`${styles.tile} ${styles.tImgPill}`}>
                        <div className={styles.img2} aria-hidden="true" />
                        <span className={styles.pill}><i aria-hidden="true">+</i>Short trips, local roads</span>
                    </Reveal>
                    <Reveal delay={80} className={`${styles.tile} ${styles.tCard} ${styles.gAcc}`}>
                        <span className={styles.chip} aria-hidden="true"><Icon name={o[1].icon} size={20} /></span>
                        <h3 className={styles.tTitle}>{o[1].title}</h3>
                        <p className={styles.tText}>{o[1].text}</p>
                    </Reveal>
                    <Reveal className={`${styles.tile} ${styles.tCard} ${styles.gAff}`}>
                        <span className={styles.chip} aria-hidden="true"><Icon name={o[2].icon} size={20} /></span>
                        <h3 className={styles.tTitle}>{o[2].title}</h3>
                        <p className={styles.tText}>{o[2].text}</p>
                    </Reveal>
                    <Reveal delay={80} className={`${styles.tile} ${styles.tGrad}`}>
                        <span className={styles.chipLight} aria-hidden="true"><Icon name={o[4].icon} size={20} /></span>
                        <h3 className={`${styles.tTitle} ${styles.onGrad}`}>{o[4].title}</h3>
                        <p className={`${styles.tText} ${styles.onGrad}`}>{o[4].text}</p>
                    </Reveal>
                    <Reveal delay={160} className={`${styles.tile} ${styles.tCard} ${styles.gAvail}`}>
                        <span className={styles.chip} aria-hidden="true"><Icon name={o[3].icon} size={20} /></span>
                        <h3 className={styles.tTitle}>{o[3].title}</h3>
                        <p className={styles.tText}>{o[3].text}</p>
                    </Reveal>
                </div>
            </section>

            {/* ---------- B. Two products (dashboard) ---------- */}
            <section className={styles.greyBand} aria-labelledby="two-title">
                <div className={`container ${styles.sec}`}>
                    <Head tag="Our two-product strategy" title="Two products, two different jobs" id="two-title">
                        OUR compares rides across providers. OUR’S is a planned booking service of its own. They complement each other and are not the same product.
                    </Head>
                    <div className={styles.dash}>
                        <Reveal className={`${styles.dCard} ${styles.dOur}`}>
                            <div className={styles.dTop}>
                                <div><h3 className={styles.dTitle}>OUR</h3><p className={styles.dSub}>Neutral fare comparison</p></div>
                                <span className={styles.dPill}>{COMPARE.our.pill}</span>
                            </div>
                            <div className={styles.dArt} aria-hidden="true">
                                <span className={styles.prov}>Ola</span><span className={styles.prov}>Uber</span><span className={styles.prov}>Rapido</span>
                                <span className={styles.dHub}><Icon name="layers" size={30} /></span>
                            </div>
                            <dl className={styles.miniGrid}>
                                {COMPARE.our.rows.map((r) => (<div key={r.label}><dt>{r.label}</dt><dd>{r.text}</dd></div>))}
                            </dl>
                        </Reveal>

                        <Reveal delay={120} className={`${styles.dCard} ${styles.dOurs}`}>
                            <div className={styles.dTop}>
                                <div><h3 className={styles.dTitle}>OUR’S</h3><p className={`${styles.dSub} ${styles.dSubL}`}>Local ride booking</p></div>
                                <span className={`${styles.dPill} ${styles.dPillL}`}>{COMPARE.ours.pill}</span>
                            </div>
                            <dl className={styles.stack}>
                                {COMPARE.ours.rows.map((r) => (<div key={r.label}><dt>{r.label}</dt><dd>{r.text}</dd></div>))}
                            </dl>
                            <p className={styles.notLive}><span aria-hidden="true" />Booking is not live yet</p>
                        </Reveal>

                        <div className={styles.dMini}>
                            <Reveal delay={80} className={`${styles.dCard} ${styles.dNum}`}>
                                <span className={styles.bigNum}>2</span>
                                <p>products, one vision for better mobility</p>
                            </Reveal>
                            <Reveal delay={160} className={styles.dCard}>
                                <h3 className={styles.miniHead}>Intended relationship</h3>
                                <ol className={styles.radios}>
                                    {FLOW.map((f, i) => (<li key={f} className={i % 2 === 0 ? styles.radioOn : ''}><span aria-hidden="true" />{f}</li>))}
                                </ol>
                            </Reveal>
                        </div>
                    </div>
                    <p className={styles.fine}>OUR may help introduce riders to OUR’S in future. This is the intended relationship between the two products, and it is not yet implemented.</p>
                </div>
            </section>

            {/* ---------- C. Rewa (pinned background) ---------- */}
            <section className={styles.rewa} aria-labelledby="rewa-title">
                <div className={styles.rewaBg} aria-hidden="true" />
                <div className={styles.rewaFront}>
                    <div className={`container ${styles.rewaHero}`}>
                        <Reveal as="p" className={styles.rewaTag}>Planned first city</Reveal>
                        <Reveal as="h2" id="rewa-title" delay={100} className={styles.rewaTitle}>Welcome to <span>Rewa</span></Reveal>
                        <Reveal as="p" delay={200} className={styles.rewaSub}>Madhya Pradesh · one city, done properly</Reveal>
                    </div>
                    <div className={`container ${styles.rewaCards}`}>
                        {REWA_POINTS.map((p, i) => (
                            <Reveal key={p.title} delay={(i % 2) * 80} className={styles.rcard}>
                                <span className={styles.rcardNo} aria-hidden="true">0{i + 1}</span>
                                <div><h3>{p.title}</h3><p>{p.text}</p></div>
                            </Reveal>
                        ))}
                        <Reveal className={styles.rewaFine}>No launch date, route coverage, fleet size or booking figures are published here, because none have been validated yet.</Reveal>
                    </div>
                </div>
            </section>

            {/* ---------- D. Local engagement (tiles) ---------- */}
            <section className={`container ${styles.sec}`} aria-labelledby="union-title">
                <Head tag="Local engagement" title="Starting with the people who know the roads" id="union-title">
                    This is the approach we intend to take with local auto unions and driver communities in Rewa.
                </Head>
                <div className={styles.tiles} role="group" aria-label="Engagement stages">
                    {UNION_STAGES.map((s, i) => (
                        <Reveal key={s.title} delay={i * 70} zoom>
                            <button type="button" className={`${styles.stile} ${i === stage ? styles.stileOn : ''}`} aria-pressed={i === stage} onClick={() => setStage(i)}>
                                <span className={styles.sNo}>0{i + 1}</span>
                                <span className={styles.sIcon} aria-hidden="true"><Icon name={STAGE_ICONS[i]} size={34} /></span>
                                <span className={styles.sName}>{s.title}</span>
                                <span className={styles.sArrow} aria-hidden="true"><Icon name="external" size={14} /></span>
                            </button>
                        </Reveal>
                    ))}
                </div>
                <div className={styles.sDetail} aria-live="polite">
                    <span>Stage {stage + 1} of {UNION_STAGES.length}</span>
                    <h3>{UNION_STAGES[stage].title}</h3>
                    <p>{UNION_STAGES[stage].text}</p>
                </div>
                <p className={styles.callout}>
                    <Icon name="receipt" size={18} />
                    This is a proposed strategy. No auto union has approved, signed or joined OUR’S, and no drivers have been onboarded.
                </p>
            </section>

            {/* ---------- E. Planned journey (editorial list) ---------- */}
            <section className={styles.journeyBand} aria-labelledby="journey-title">
                <div className={`container ${styles.sec}`}>
                    <Head tag="How OUR’S is intended to work" title="The planned rider journey" id="journey-title">
                        This is the customer journey we are designing towards. It is not a live booking service.
                    </Head>
                    <ol className={styles.journey}>
                        {JOURNEY.map((j, i) => (
                            <li key={j.title} ref={(el) => { rows.current[i] = el; }} data-i={i} className={`${styles.jRow} ${reduced || i === active ? styles.jOn : ''}`}>
                                <span className={styles.jNo}>0{i + 1}</span>
                                <h3 className={styles.jTitle}>{j.title}</h3>
                                <p className={styles.jText}>{j.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ---------- F. Roadmap (wave) ---------- */}
            <section className={`container ${styles.sec}`} aria-labelledby="road-title">
                <Head tag="Tier-3 expansion roadmap" title="A realistic path beyond Rewa" id="road-title" center>
                    A proposed sequence with no deadlines. Each phase begins only when the one before it has been validated.
                </Head>
                <Reveal className={styles.wave}>
                    <svg className={styles.waveSvg} viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                        <path d={WAVE} className={styles.waveShadow} transform="translate(0 16)" />
                        <path d={WAVE} className={styles.waveLine} />
                    </svg>
                    {ROADMAP.map((p, i) => (
                        <span key={p.id} className={styles.waveNode} style={{ left: `${12.5 + 25 * i}%`, top: `${(WAVE_Y[i] / 220) * 100}%` }}>
                            <Icon name={ROAD_ICONS[i]} size={22} />
                        </span>
                    ))}
                </Reveal>
                <ol className={styles.phases}>
                    {ROADMAP.map((p, i) => (
                        <Reveal as="li" key={p.id} delay={i * 90} className={styles.phase}>
                            <span className={styles.phaseNum} aria-hidden="true">{i + 1}</span>
                            <span className={styles.phaseLabel}>{p.label}</span>
                            <h3 className={styles.phaseTitle}>{p.title}</h3>
                            <ul>{p.points.map((x) => (<li key={x}>{x}</li>))}</ul>
                        </Reveal>
                    ))}
                </ol>
            </section>

            {/* ---------- Coming soon ---------- */}
            <section className={styles.soon} aria-labelledby="soon-title">
                <div className={styles.soonBg} aria-hidden="true" />
                <div className={styles.soonInner}>
                    <Reveal as="h2" id="soon-title" className={styles.soonTitle}><span>Coming</span><span>Soon</span></Reveal>
                    <Reveal as="p" delay={150} className={styles.soonText}>OUR’S is being built for the next tier of cities. Booking is not live yet.</Reveal>
                </div>
                <Link to="/" className={styles.soonBtn}><Icon name="external" size={16} />Explore OUR comparison</Link>
            </section>
        </>
    );
}
import styles from './Section.module.css';

export default function Section({ id, eyebrow, title, intro, tone = 'plain', children, align = 'center' }) {
  return (
    <section id={id} className={`${styles.section} ${styles[tone]}`} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="container">
        {(title || eyebrow) && (
          <header className={`${styles.head} ${align === 'left' ? styles.left : ''}`}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <h2 id={id ? `${id}-title` : undefined} className={styles.title}>{title}</h2>}
            {intro && <p className={styles.intro}>{intro}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import Icon from './Icon';
import styles from './PromiseBar.module.css';

export default function PromiseBar({ title, text, to = '/', cta }) {
    return (
        <section className={styles.wrap} aria-label={title}>
            <div className={`container ${styles.bar}`}>
                <div className={styles.copy}>
                    <h2 className={styles.title}>{title}</h2>
                    <p className={styles.text}>{text}</p>
                </div>
                <Link to={to} className={styles.btn}>
                    {cta}
                    <span className={styles.arrow} aria-hidden="true"><Icon name="arrowRight" size={16} /></span>
                </Link>
            </div>
        </section>
    );
}
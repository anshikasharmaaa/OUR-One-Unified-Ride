import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Icon from '../../components/common/Icon';
import styles from './Profile.module.css';

/** Shared frame for every profile sub-page: back link, title, narrow content column. */
export default function ProfileShell({ title, lead, children }) {
    return (
        <div className={styles.page}>
            <Helmet><title>{`${title} · OUR`}</title></Helmet>
            <div className={`${styles.wrap} ${styles.narrow}`}>
                <Link to="/profile" className={styles.back}><Icon name="chevronLeft" size={18} />Profile</Link>
                <h1 className={styles.title}>{title}</h1>
                {lead && <p className={styles.lead}>{lead}</p>}
                {children}
            </div>
        </div>
    );
}
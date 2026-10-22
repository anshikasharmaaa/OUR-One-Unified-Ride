import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Icon from '../../components/common/Icon';
import StateMessage from '../../components/admin/StateMessage';
import AvatarBadge from './AvatarBadge';
import useApi from '../../hooks/useApi';
import useAvatarUrl from '../../hooks/useAvatarUrl';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { accountService } from '../../services/accountService';
import { GENDER_LABEL } from '../../utils/profileOptions';
import styles from './Profile.module.css';

const monthYear = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' });

function Row({ to, icon, label, badge, onClick, danger }) {
    const body = (
        <>
            <span className={styles.rowIcon}><Icon name={icon} size={18} /></span>
            <span className={styles.rowText}>{label}</span>
            {badge > 0 && <span className={styles.count} aria-label={`${badge} unread`}>{badge}</span>}
            <Icon name="chevronRight" size={18} className={styles.chev} />
        </>
    );
    return (
        <li>
            {to ? <Link to={to} className={styles.row}>{body}</Link>
                : <button type="button" className={`${styles.row} ${danger ? styles.danger : ''}`} onClick={onClick}>{body}</button>}
        </li>
    );
}

export default function ProfileHome() {
    const { signOut } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const profile = useApi(() => accountService.profile());
    const unread = useApi(() => accountService.unreadCount());
    const p = profile.data?.profile;
    const photo = useAvatarUrl(p?.hasAvatar ? p.avatarVersion : 0);

    const logout = async () => {
        await signOut();
        toast.success('You have been signed out.');
        navigate('/', { replace: true });
    };
    const notAdded = <span className={styles.muted}>Not added</span>;

    return (
        <div className={styles.page}>
            <Helmet><title>My profile · OUR</title></Helmet>
            <div className={styles.wrap}>
                <h1 className={styles.title}>Profile</h1>

                {profile.loading && <div className={`${styles.card} ${styles.pad}`} role="status" aria-label="Loading your profile" style={{ minHeight: 280 }} />}
                {profile.error && <div className={styles.card}><StateMessage kind="error" title="Couldn’t load your profile" onRetry={profile.reload}>{profile.error}</StateMessage></div>}

                {p && (
                    <div className={styles.grid}>
                        <section className={`${styles.card} ${styles.me} ${styles.sticky}`} aria-labelledby="me-name">
                            <AvatarBadge name={p.name} color={p.avatarColor} src={photo} />
                            <h2 id="me-name" className={styles.name}>{p.name}</h2>
                            <p className={styles.email}>{p.email}</p>
                            <p className={styles.sub}>{p.phone ? `+91 ${p.phone}` : 'Phone not added'} · Member since {monthYear.format(new Date(p.memberSince))}</p>
                            <Link to="/profile/edit" className={styles.editBtn}><Icon name="user" size={16} />Edit Profile</Link>
                            <dl className={styles.facts}>
                                <div><dt>Gender</dt><dd>{p.gender ? GENDER_LABEL[p.gender] : notAdded}</dd></div>
                                <div><dt>Date of birth</dt><dd>{p.dateOfBirth ? dateFmt.format(new Date(`${p.dateOfBirth}T00:00:00Z`)) : notAdded}</dd></div>
                                <div><dt>Emergency contact</dt><dd>{p.emergencyContact ? `${p.emergencyContact.name || 'Contact'} · +91 ${p.emergencyContact.phone}` : notAdded}</dd></div>
                            </dl>
                        </section>

                        <div className={styles.stack}>
                            <nav className={styles.card} aria-label="Your activity">
                                <ul className={styles.group}>
                                    <Row to="/profile/rides" icon="car" label="My Rides" />
                                    <Row to="/profile/favorites" icon="pin" label="Favorite Locations" />
                                    <Row to="/profile/notifications" icon="mail" label="Notifications" badge={unread.data?.count || 0} />
                                </ul>
                            </nav>
                            <nav className={styles.card} aria-label="Safety and rewards">
                                <ul className={styles.group}>
                                    <Row to="/profile/safety" icon="check" label="Safety" />
                                    <Row to="/profile/referral" icon="star" label="Refer & Earn" />
                                </ul>
                            </nav>
                            <nav className={styles.card} aria-label="Account">
                                <ul className={styles.group}>
                                    <Row to="/profile/settings" icon="settings" label="Settings" />
                                    <Row to="/contact" icon="compass" label="Help & support" />
                                    <Row onClick={logout} icon="logout" label="Log out" danger />
                                </ul>
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
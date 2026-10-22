import styles from './Profile.module.css';

export default function AvatarBadge({ name = '', color = 'blue', size = 88, src = '' }) {
    const cls = styles[`av_${color}`] || styles.av_blue;
    return (
        <span className={`${styles.avatar} ${cls}`} style={{ width: size, height: size, fontSize: size * 0.42, overflow: 'hidden' }} aria-hidden="true">
            {src
                ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : name.trim().charAt(0).toUpperCase() || '?'}
        </span>
    );
}
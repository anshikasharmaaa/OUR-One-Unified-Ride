import { Link } from 'react-router-dom';
import Badge from '../../components/admin/Badge';
import { formatDateTime, VEHICLE_SHORT } from '../../utils/format';
import tableStyles from '../../components/admin/DataTable.module.css';

const when = (r) => formatDateTime(r.createdAt);
const statusTone = { ACTIVE: 'good', SUSPENDED: 'bad' };
const statusLabel = (s = 'ACTIVE') => s[0] + s.slice(1).toLowerCase();

export const userColumns = () => [
  { key: 'name', header: 'Name', render: (r) => <>{r.name}<span className={tableStyles.sub}>{r.email}</span><span className={tableStyles.sub}>{r.phone ? `+91 ${r.phone}` : 'No phone'}</span></> },
  { key: 'verified', header: 'Email', render: (r) => <Badge tone={r.emailVerified ? 'good' : 'warn'}>{r.emailVerified ? 'Verified' : 'Unverified'}</Badge> },
  { key: 'status', header: 'Account', render: (r) => <Badge tone={statusTone[r.status] || 'neutral'}>{statusLabel(r.status)}</Badge> },
  { key: 'method', header: 'Sign-in', render: (r) => r.signInMethods.join(' + ') || '—' },
  { key: 'rides', header: 'Ride events', render: (r) => r.rideEvents },
  { key: 'joined', header: 'Registered', nowrap: true, render: when },
  { key: 'actions', header: 'Action', render: (r) => <Link to={`/admin/users/${r.id}`}>View history</Link> },
];
export const searchColumns = [
  { key: 'pickup', header: 'Pickup', render: (r) => r.pickup },
  { key: 'dropoff', header: 'Drop-off', render: (r) => r.dropoff },
  { key: 'type', header: 'Ride type', render: (r) => VEHICLE_SHORT[r.vehicleType] || r.vehicleType },
  { key: 'by', header: 'Searched by', render: (r) => (r.user ? <>{r.user.name}<span className={tableStyles.sub}>{r.user.email}</span></> : 'Guest') },
  { key: 'when', header: 'When', nowrap: true, render: when },
];

export const compactUserColumns = [
  { key: 'name', header: 'User', render: (r) => <>{r.name}<span className={tableStyles.sub}>{r.email}</span></> },
  { key: 'joined', header: 'Joined', render: when },
];
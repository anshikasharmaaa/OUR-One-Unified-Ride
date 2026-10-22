import { formatDateTime, VEHICLE_SHORT } from '../../utils/format';

export const mySearchColumns = [
  { key: 'pickup', header: 'Pickup', render: (r) => r.pickup },
  { key: 'dropoff', header: 'Drop-off', render: (r) => r.dropoff },
  { key: 'type', header: 'Ride type', render: (r) => VEHICLE_SHORT[r.vehicleType] || r.vehicleType },
  { key: 'when', header: 'When', nowrap: true, render: (r) => formatDateTime(r.createdAt) },
];

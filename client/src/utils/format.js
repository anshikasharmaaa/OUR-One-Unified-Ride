const dt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
const day = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const formatDateTime = (v) => (v ? dt.format(new Date(v)) : '—');
export const formatDayKey = (key) => day.format(new Date(`${key}T00:00:00Z`));
export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0);
export const VEHICLE_SHORT = { CAB: 'Cab', AUTO: 'Auto', BIKE_TAXI: 'Bike taxi', ANY: 'Any', BIKE: 'Bike', ECONOMY_CAB: 'Economy cab', PREMIUM_CAB: 'Premium cab' };

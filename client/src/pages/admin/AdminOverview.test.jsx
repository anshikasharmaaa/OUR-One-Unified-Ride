import { Route } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLayout from '../../layouts/AdminLayout';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import DataTable from '../../components/admin/DataTable';
import { renderWithProviders, asUser } from '../../test/utils';
import { adminApi } from '../../services/adminApi';

vi.mock('../../services/adminApi', () => ({ adminApi: { overview: vi.fn(), health: vi.fn(), contactCounts: vi.fn(), users: vi.fn(), stats: vi.fn(), searches: vi.fn(), analytics: vi.fn() } }));
beforeEach(() => {
    vi.clearAllMocks();
    adminApi.contactCounts.mockResolvedValue({ open: 2, inProgress: 0, resolved: 1, total: 3 });
    adminApi.health.mockResolvedValue({ db: 'up', uptimeSeconds: 600 });
});

const days = ['2026-10-20', '2026-10-21', '2026-10-22'];
const OV = (over = {}) => ({
    range: { days: 14, from: days[0], to: days[2], timezone: 'Asia/Kolkata' },
    totals: {
        users: { total: 7, inRange: 3, change: 50 }, comparisons: { total: 12, inRange: 4, change: null }, redirects: { total: 2, inRange: 1, change: null },
        queries: { total: 3, inRange: 3, change: null, open: 2, inProgress: 0, resolved: 1 }, providers: { total: 3, active: 3 },
    },
    series: { days, users: [0, 1, 2], comparisons: [1, 1, 2], redirects: [0, 0, 1], queriesReceived: [1, 1, 1], queriesResolved: [0, 0, 1] },
    providerSelections: [{ provider: 'ola', name: 'Ola', count: 2 }],
    activity: [{ id: 'u1', type: 'user', label: 'Riya Sharma created an account', at: '2026-10-22T10:00:00Z' }],
    ...over,
});
const page = (items) => ({ items, total: items.length, page: 1, limit: 10 });
const routes = (
    <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUsers />} />
    </Route>
);
const renderAdmin = (route = '/admin') => renderWithProviders(null, { route, auth: asUser('ADMIN', { name: 'Platform Admin' }), routes });

describe('AdminOverview', () => {
    test('shows backend figures and only shows a percentage when one was computed', async () => {
        adminApi.overview.mockResolvedValue(OV());
        renderAdmin();
        expect(await screen.findByRole('heading', { name: /Hello Platform/ })).toBeInTheDocument();
        expect(await screen.findByText('Riya Sharma created an account')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getAllByText(/vs previous period/)).toHaveLength(1); // only users has a real change value
    });

    test('empty datasets show a real zero state, not made-up trends', async () => {
        const zero = [0, 0, 0];
        adminApi.overview.mockResolvedValue(OV({ series: { days, users: zero, comparisons: zero, redirects: zero, queriesReceived: zero, queriesResolved: zero }, providerSelections: [], activity: [] }));
        renderAdmin();
        expect((await screen.findAllByText('No activity recorded in this period.')).length).toBeGreaterThan(0);
        expect(screen.getByText('No provider selections yet')).toBeInTheDocument();
        expect(screen.getByText('No activity yet')).toBeInTheDocument();
    });

    test('a failing request degrades to an error with retry', async () => {
        const err = Object.assign(new Error('x'), { response: { data: { message: 'Server exploded' } } });
        adminApi.overview.mockRejectedValueOnce(err).mockResolvedValue(OV());
        const user = userEvent.setup();
        renderAdmin();
        expect(await screen.findByText(/Server exploded/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(screen.getByRole('heading', { name: /Hello Platform/ })).toBeInTheDocument());
    });
});

describe('AdminLayout and Users', () => {
    test('sidebar lists the new sections and no obsolete ones', async () => {
        adminApi.overview.mockResolvedValue(OV());
        renderAdmin();
        const nav = within(screen.getByRole('navigation'));
        ['Overview', 'Contact Queries', 'Users', 'Providers', 'Ride Searches', 'Comparison Activity', 'Analytics & Reports', 'Settings'].forEach((n) => expect(nav.getByRole('link', { name: new RegExp(n) })).toBeInTheDocument());
        expect(nav.queryByRole('link', { name: /Drivers/ })).toBeNull();
        expect(await screen.findByText('2', { selector: 'span' })).toBeInTheDocument(); // open-query badge from the API
    });

    test('the users table has no Approve or Reject controls', async () => {
        adminApi.overview.mockResolvedValue(OV());
        adminApi.users.mockResolvedValue(page([{ id: '1', name: 'Riya Sharma', email: 'r@example.com', emailVerified: true, status: 'ACTIVE', signInMethods: ['Email'], rideEvents: 0, createdAt: '2026-10-09T10:00:00Z' }]));
        renderAdmin('/admin/users');
        expect(await screen.findByText('Riya Sharma')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /approve|reject/i })).toBeNull();
        expect(screen.queryByText(/pending/i)).toBeNull();
    });
});

describe('DataTable states', () => {
    const cols = [{ key: 'a', header: 'A', render: (r) => r.a }];
    test('loading, error (with retry), empty and data states', async () => {
        const user = userEvent.setup();
        const onRetry = vi.fn();
        const { rerender } = renderWithProviders(<DataTable caption="T" columns={cols} loading rows={null} />);
        expect(screen.getByRole('region', { name: 'T' })).toHaveAttribute('aria-busy', 'true');
        rerender(<DataTable caption="T" columns={cols} error="Boom" onRetry={onRetry} />);
        expect(screen.getByRole('alert')).toHaveTextContent('Boom');
        await user.click(screen.getByRole('button', { name: 'Try again' }));
        expect(onRetry).toHaveBeenCalled();
        rerender(<DataTable caption="T" columns={cols} rows={[]} emptyTitle="Nothing" emptyText="Add some" />);
        expect(screen.getByText('Nothing')).toBeInTheDocument();
        rerender(<DataTable caption="T" columns={cols} rows={[{ id: '1', a: 'Row one' }]} />);
        expect(screen.getByRole('cell', { name: 'Row one' })).toBeInTheDocument();
    });
});
import { Route } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLayout from '../../layouts/AdminLayout';
import AdminOverview from './AdminOverview';
import AdminSearches from './AdminSearches';
import AdminComparisons from './AdminComparisons';
import DataTable from '../../components/admin/DataTable';
import { renderWithProviders, asUser } from '../../test/utils';
import { adminApi } from '../../services/adminApi';

vi.mock('../../services/adminApi', () => ({ adminApi: { stats: vi.fn(), users: vi.fn(), drivers: vi.fn(), searches: vi.fn(), analytics: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

const STATS = { users: { total: 7, verified: 6, last7Days: 3, pending: 2, approved: 4, rejected: 1, suspended: 0 }, drivers: { total: 5, emailVerified: 4, pending: 2, approved: 1, rejected: 1, suspended: 0 }, searches: { total: 12, last7Days: 8, last24Hours: 2 }, comparisons: { available: false } };
const page = (items) => ({ items, total: items.length, page: 1, limit: 5 });
const routes = (
  <Route element={<AdminLayout />}>
    <Route path="/admin" element={<AdminOverview />} />
    <Route path="/admin/searches" element={<AdminSearches />} />
    <Route path="/admin/comparisons" element={<AdminComparisons />} />
  </Route>
);
const renderAdmin = (route = '/admin', auth = asUser('ADMIN', { name: 'Platform Admin' })) => renderWithProviders(null, { route, auth, routes });

describe('AdminOverview', () => {
  test('shows real figures from the API and marks comparison activity as unavailable', async () => {
    adminApi.stats.mockResolvedValue(STATS);
    adminApi.users.mockResolvedValue(page([{ id: '1', name: 'Riya Sharma', email: 'r@example.com', emailVerified: true, status: 'ACTIVE', approvalStatus: 'PENDING', signInMethods: ['Email'], createdAt: '2026-10-09T10:00:00Z' }]));
    adminApi.drivers.mockResolvedValue(page([]));
    adminApi.searches.mockResolvedValue(page([{ id: 's1', pickup: 'Palasia', dropoff: 'Airport', vehicleType: 'AUTO', user: null, createdAt: '2026-10-09T10:00:00Z' }]));
    renderAdmin();
    expect(await screen.findByText('Riya Sharma')).toBeInTheDocument();
    expect(await screen.findByText('Palasia')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText('No driver requests yet')).toBeInTheDocument();
    expect(screen.getByText('Not available yet')).toBeInTheDocument();
    const cards = screen.getAllByText(/^(7|5|12)$/);
    expect(cards.map((c) => c.textContent)).toEqual(['7', '5', '12']);
  });

  test('a failing metric degrades to "Unavailable" with a retry, never a made-up number', async () => {
    const err = Object.assign(new Error('x'), { response: { data: { message: 'Server exploded' } } });
    adminApi.stats.mockRejectedValueOnce(err).mockResolvedValue(STATS);
    adminApi.users.mockResolvedValue(page([]));
    adminApi.drivers.mockResolvedValue(page([]));
    adminApi.searches.mockResolvedValue(page([]));
    const user = userEvent.setup();
    renderAdmin();
    expect((await screen.findAllByText('Unavailable')).length).toBe(4);
    expect(screen.getByText(/Server exploded/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByText('12')).toBeInTheDocument());
  });
});

describe('AdminLayout', () => {
  beforeEach(() => {
    adminApi.stats.mockResolvedValue(STATS);
    ['users', 'drivers', 'searches'].forEach((k) => adminApi[k].mockResolvedValue(page([])));
  });

  test('lists every section, marks the current one, and shows the admin profile', async () => {
    renderAdmin('/admin/searches');
    const nav = within(screen.getByRole('navigation'));
    ['Overview', 'Ride Searches', 'Comparison Activity', 'Users', 'Drivers', 'Analytics & Reports', 'Settings'].forEach((n) => expect(nav.getByRole('link', { name: n })).toBeInTheDocument());
    expect(nav.getByRole('link', { name: 'Ride Searches' })).toHaveAttribute('aria-current', 'page');
    expect(nav.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ride Searches');
    expect(screen.getByText('Platform Admin')).toBeInTheDocument();
    expect(await screen.findByText('No searches yet')).toBeInTheDocument();
  });

  test('navigates between sections and keeps a single h1', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin');
    await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Comparison Activity' }));
    expect(await screen.findByText(/isn’t available yet/)).toBeInTheDocument();
    expect(screen.getByTestId('loc')).toHaveTextContent('/admin/comparisons');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  test('sidebar collapses and expands; log out calls the session sign-out', async () => {
    const user = userEvent.setup();
    const { auth } = renderAdmin('/admin');
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /log out/i }));
    await waitFor(() => expect(auth.signOut).toHaveBeenCalledTimes(1));
  });

  test('mobile drawer opens from the hamburger and closes with Escape', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin');
    const open = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(open);
    expect(open).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(open).toHaveAttribute('aria-expanded', 'false');
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

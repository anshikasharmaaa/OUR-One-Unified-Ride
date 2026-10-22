import { Route } from 'react-router-dom';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountLayout from '../../layouts/AccountLayout';
import AccountDashboard from './AccountDashboard';
import ApprovalActions from '../admin/ApprovalActions';
import { renderWithProviders, asUser } from '../../test/utils';
import { searchService } from '../../services/searchService';

vi.mock('../../services/searchService', () => ({ searchService: { create: vi.fn(), mine: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('rider dashboard', () => {
  const routes = (<Route element={<AccountLayout />}><Route path="/account" element={<AccountDashboard />} /></Route>);

  test('has its own navigation and shows the user’s real search history', async () => {
    searchService.mine.mockResolvedValue({ total: 1, items: [{ id: '1', pickup: 'Palasia', dropoff: 'Rajwada', vehicleType: 'AUTO', createdAt: '2026-10-09T10:00:00Z' }] });
    renderWithProviders(null, { route: '/account', routes, auth: asUser('USER', { name: 'Anshika Sharma' }) });
    const nav = within(screen.getByRole('navigation', { name: '', hidden: true }));
    ['Dashboard', 'Search Rides', 'My Searches', 'My Profile'].forEach((n) => expect(nav.getByRole('link', { name: n })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /welcome back, anshika/i })).toBeInTheDocument();
    expect(await screen.findAllByText(/Palasia/)).not.toHaveLength(0);
  });

  test('shows an honest empty state when there are no searches', async () => {
    searchService.mine.mockResolvedValue({ total: 0, items: [] });
    renderWithProviders(null, { route: '/account', routes, auth: asUser('USER') });
    expect(await screen.findByText('No searches yet')).toBeInTheDocument();
  });
});

describe('ApprovalActions', () => {
  test('a pending rider can be approved or rejected; approving is blocked until the email is verified', async () => {
    const user = userEvent.setup();
    const decide = vi.fn().mockResolvedValue({});
    const onDone = vi.fn();
    const { unmount } = renderWithProviders(<ApprovalActions row={{ id: 'u1', name: 'Riya', approvalStatus: 'PENDING', emailVerified: true }} decide={decide} onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: 'Approve Riya' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(decide).toHaveBeenCalledWith('u1', 'APPROVED');
    expect(screen.getByRole('button', { name: 'Reject Riya' })).toBeInTheDocument();
    unmount();
    renderWithProviders(<ApprovalActions row={{ id: 'u2', name: 'Sam', approvalStatus: 'PENDING', emailVerified: false }} decide={decide} onDone={onDone} />);
    expect(screen.getByRole('button', { name: 'Approve Sam' })).toBeDisabled();
  });

  test('an approved rider can only be suspended', () => {
    renderWithProviders(<ApprovalActions row={{ id: 'u1', name: 'Riya', approvalStatus: 'APPROVED', emailVerified: true }} decide={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Suspend Riya' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve riya/i })).not.toBeInTheDocument();
  });
});

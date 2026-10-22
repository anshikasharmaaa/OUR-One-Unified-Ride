import { Route } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import DriverLoginPage from '../driver/DriverLoginPage';
import AdminLoginPage from '../admin/AdminLoginPage';
import { renderWithProviders } from '../../test/utils';
import { authService, driverService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: { login: vi.fn(), google: vi.fn() },
  driverService: { login: vi.fn() },
  adminService: { login: vi.fn() },
}));

const fill = async (user, email, password) => {
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
};
const apiError = (status, code, message) => Object.assign(new Error('x'), { response: { status, data: { code, message } } });

beforeEach(() => vi.clearAllMocks());

describe('LoginPage', () => {
  const render = () => renderWithProviders(null, { route: '/login', routes: (<><Route path="/login" element={<LoginPage />} /><Route path="/" element={<div>home page</div>} /><Route path="/verify-email" element={<div>verify page</div>} /></>) });

  test('shows inline validation and does not call the API for empty or invalid input', async () => {
    const user = userEvent.setup();
    render();
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Email'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('shows the server error and never a success message when login fails', async () => {
    authService.login.mockRejectedValue(apiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.'));
    const user = userEvent.setup();
    const { auth } = render();
    await fill(user, 'a@example.com', 'Wrong!Pass1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(screen.queryByText(/welcome back\./i)).not.toBeInTheDocument();
  });

  test('disables the button while the request is in flight, then signs in only after the server confirms', async () => {
    let resolve;
    authService.login.mockReturnValue(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    const { auth } = render();
    await fill(user, 'a@example.com', 'Str0ng!Passw0rd');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled());
    expect(auth.signIn).not.toHaveBeenCalled();
    resolve({ data: { accessToken: 't', user: { role: 'USER', name: 'A', email: 'a@example.com' } } });
    await waitFor(() => expect(auth.signIn).toHaveBeenCalledTimes(1));
  });

  test('network failure produces an actionable message', async () => {
    authService.login.mockRejectedValue(Object.assign(new Error('Network Error'), { request: {} }));
    const user = userEvent.setup();
    render();
    await fill(user, 'a@example.com', 'Str0ng!Passw0rd');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach the server/i);
  });

  test('an unverified account is sent to email verification', async () => {
    authService.login.mockRejectedValue(apiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email to continue.'));
    const user = userEvent.setup();
    render();
    await fill(user, 'a@example.com', 'Str0ng!Passw0rd');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('verify page')).toBeInTheDocument();
  });

  test('never links to the admin login; points drivers/riders to their own login; offers forgot-password and signup', () => {
    render();
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /driver \/ rider log in/i })).toHaveAttribute('href', '/driver/login');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/signup');
  });
});

describe('DriverLoginPage', () => {
  test.each([
    ['DRIVER_PENDING', 'Your registration was submitted and is awaiting administrator approval.'],
    ['DRIVER_REJECTED', 'Your registration was rejected. Please contact the platform administrator.'],
    ['DRIVER_SUSPENDED', 'This driver account is suspended. Access is unavailable.'],
  ])('shows the %s message and grants nothing', async (code, message) => {
    driverService.login.mockRejectedValue(apiError(403, code, message));
    const user = userEvent.setup();
    const { auth } = renderWithProviders(<DriverLoginPage />, { route: '/driver/login', routes: <Route path="/driver/login" element={<DriverLoginPage />} /> });
    await fill(user, 'd@example.com', 'Str0ng!Passw0rd');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(auth.signIn).not.toHaveBeenCalled();
  });
});

describe('AdminLoginPage', () => {
  test('has no Google, signup or recovery affordances', () => {
    renderWithProviders(null, { route: '/our-control', routes: <Route path="/our-control" element={<AdminLoginPage />} /> });
    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument();
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/forgot/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create|sign up|register/i)).not.toBeInTheDocument();
  });
});

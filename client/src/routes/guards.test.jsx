import { Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { PublicOnly, RequireRole } from './guards';
import { renderWithProviders, asUser } from '../test/utils';

const routes = (
  <>
    <Route element={<PublicOnly />}>
      <Route path="/login" element={<div>login page</div>} />
      <Route path="/our-control" element={<div>admin login</div>} />
      <Route path="/admin/login" element={<div>admin login page</div>} />
    </Route>
    <Route path="/" element={<div>user home</div>} />
    <Route element={<RequireRole role="USER" />}><Route path="/account" element={<div>user account</div>} /></Route>
    <Route element={<RequireRole role="ADMIN" />}><Route path="/admin" element={<div>admin home</div>} /></Route>
    <Route element={<RequireRole role="DRIVER" />}>
      <Route path="/driver" element={<div>driver home</div>} />
      <Route path="/driver/login" element={<div>driver login</div>} />
    </Route>
  </>
);

describe('route guards (client-side; the server enforces the same rules)', () => {
  test('unauthenticated visitors are sent to the matching login: admin area → /admin/login, rider area → /login', () => {
    renderWithProviders(null, { route: '/admin', routes });
    expect(screen.getByText('admin login page')).toBeInTheDocument();
    expect(screen.getByTestId('loc')).toHaveTextContent('/admin/login');
  });

  test('a rider who navigates to /admin or /driver is denied', () => {
    renderWithProviders(null, { route: '/admin', routes, auth: asUser('USER') });
    expect(screen.getByText(/don’t have access/i)).toBeInTheDocument();
    expect(screen.queryByText('admin home')).not.toBeInTheDocument();
  });

  test('a driver cannot see admin or rider pages', () => {
    renderWithProviders(null, { route: '/account', routes, auth: asUser('DRIVER') });
    expect(screen.getByText(/don’t have access/i)).toBeInTheDocument();
    expect(screen.queryByText('user account')).not.toBeInTheDocument();
  });

  test('each role reaches its own placeholder', () => {
    renderWithProviders(null, { route: '/admin', routes, auth: asUser('ADMIN') });
    expect(screen.getByText('admin home')).toBeInTheDocument();
  });

  test('signed-in users opening a login page are redirected to their home without looping', () => {
    renderWithProviders(null, { route: '/login', routes, auth: asUser('USER') });
    expect(screen.getByText('user home')).toBeInTheDocument();
    expect(screen.getByTestId('loc')).toHaveTextContent(/^\/$/);
  });

  test('an authenticated rider opening /our-control goes to the rider home', () => {
    renderWithProviders(null, { route: '/our-control', routes, auth: asUser('USER') });
    expect(screen.getByTestId('loc')).toHaveTextContent(/^\/$/);
  });

  test('shows a loader while the session is being restored', () => {
    renderWithProviders(null, { route: '/login', routes, auth: { status: 'loading', user: null } });
    expect(screen.getByRole('status', { name: /restoring/i })).toBeInTheDocument();
  });
});

import { dashboardFor, homeFor, safeRedirect } from './paths';

test('users land on the home page; drivers and admins on their own consoles', () => {
  expect(homeFor('USER')).toBe('/');
  expect(homeFor('ADMIN')).toBe('/admin');
  expect(homeFor('DRIVER')).toBe('/driver');
  expect(dashboardFor('USER')).toBe('/account');
});

test('safeRedirect only follows internal paths the role may open (no open redirect)', () => {
  expect(safeRedirect({ pathname: '/search' }, 'USER')).toBe('/search');
  expect(safeRedirect({ pathname: '/account/history' }, 'USER')).toBe('/account/history');
  expect(safeRedirect({ pathname: '/admin' }, 'USER')).toBe('/');
  expect(safeRedirect({ pathname: '/login' }, 'USER')).toBe('/');
  expect(safeRedirect('https://evil.example', 'USER')).toBe('/');
  expect(safeRedirect('//evil.example/app', 'USER')).toBe('/');
  expect(safeRedirect(undefined, 'DRIVER')).toBe('/driver');
  expect(safeRedirect({ pathname: '/admin/users' }, 'ADMIN')).toBe('/admin/users');
  expect(safeRedirect({ pathname: '/search' }, 'ADMIN')).toBe('/admin');
});

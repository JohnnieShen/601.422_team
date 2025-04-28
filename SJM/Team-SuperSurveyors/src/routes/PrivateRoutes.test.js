import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoutes';

jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('react-spinners', () => ({
  ClipLoader: (props) => <div data-testid="spinner" {...props} />,
}));
jest.mock('react-bootstrap', () => ({
  Container: ({ children, ...props }) => <div data-testid="container" {...props}>{children}</div>,
}));

import { useAuthState } from 'react-firebase-hooks/auth';

describe('<PrivateRoute />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('shows loading spinner when auth is loading', () => {
    useAuthState.mockReturnValue([null, true, null]);

    render(<PrivateRoute />);

    // Container wrapper and spinner should appear
    expect(screen.getByTestId('container')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  test('shows error message when auth hook errors', () => {
    useAuthState.mockReturnValue([null, false, 'Auth failed']);

    render(<PrivateRoute />);

    expect(screen.getByText(/Error: Auth failed/)).toBeInTheDocument();
  });

  test('redirects to /login when no user is authenticated', () => {
    useAuthState.mockReturnValue([null, false, null]);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Navigate should send us to the login route
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders child routes when user is authenticated', () => {
    useAuthState.mockReturnValue([{ uid: 'user1' }, false, null]);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

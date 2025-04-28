jest.mock('firebase/auth', () => ({
    __esModule: true,
    getAuth: jest.fn(() => ({
      currentUser: null,
      onAuthStateChanged: jest.fn()
    }))
  }));
  
  jest.mock('../services/userService', () => ({
    loginUser: jest.fn(),
    loginGoogleUser: jest.fn()
  }));
  
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
  }));
  
  import React from 'react';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';
  import Login from './Login';
  import { loginUser, loginGoogleUser } from '../services/userService';
  import { getAuth } from 'firebase/auth';
  
  describe('Login Component Additional Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      getAuth.mockImplementation(() => ({
        currentUser: null,
        onAuthStateChanged: jest.fn()
      }));
    });
  
    test('does not redirect if currentUser is null', () => {
      // When no user is authenticated, navigate should not be called immediately.
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  
    test('handles generic error on email/password login', async () => {
      const genericError = new Error('Some unexpected error');
      loginUser.mockRejectedValue(genericError);
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      // Simulate clicking on "Sign In" without providing credentials
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  
      await waitFor(() => {
        // Expect the error message to be exactly the error.message
        expect(screen.getByText('Some unexpected error')).toBeInTheDocument();
      });
    });
  
    test('submits form when Enter key is pressed', async () => {
      loginUser.mockResolvedValue({});
      const { container } = render(
        <MemoryRouter><Login/></MemoryRouter>
      );
  
      // Set email and password values
      fireEvent.change(screen.getByLabelText(/email address/i, { selector: 'input' }), {
        target: { value: 'enter@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }), {
        target: { value: 'enterpassword' },
      });
  
      // Simulate pressing Enter on the password input to submit the form
      const form = container.querySelector('form');
      fireEvent.submit(form);
      
      await waitFor(() => {
        expect(loginUser).toHaveBeenCalledWith('enter@example.com', 'enterpassword');
      });
    });
  
    test('handles Google login failure by logging error', async () => {
      const googleError = new Error('Google login failed');
      // Spy on console.log to check that the error is logged.
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      loginGoogleUser.mockRejectedValue(googleError);
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      // Simulate clicking the "Login with" Google button
      fireEvent.click(screen.getByRole('button', { name: /Login with/i }));
  
      await waitFor(() => {
        // Check that the error log contains our message
        expect(consoleSpy).toHaveBeenCalledWith(
          "Error trying to login with Google: " + googleError
        );
      });
  
      consoleSpy.mockRestore();
    });
    test('redirects authenticated user first to "/" then immediately to "/home"', () => {
      getAuth.mockImplementation(() => ({
        currentUser: { uid: 'abc123' },
        onAuthStateChanged: jest.fn(),
      }));
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      expect(mockNavigate).toHaveBeenNthCalledWith(1, '/');
      expect(mockNavigate).toHaveBeenNthCalledWith(2, '/home');
      expect(mockNavigate).toHaveBeenCalledTimes(2);
    });
  
    test('shows success alert then redirects to /home after successful login', async () => {
      jest.useFakeTimers();
      loginUser.mockResolvedValue({});
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.change(screen.getByLabelText(/email address/i, { selector: 'input' }), {
        target: { value: 'ok@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i,      { selector: 'input' }), {
        target: { value: 'goodpass' },
      });
  
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  
      const success = await screen.findByText('Successfully signed in!');
      expect(screen.getByText('Successfully signed in!')).toBeInTheDocument();
  
      expect(screen.queryByText(/please enter a valid email address/i)).toBeNull();
  
      jest.advanceTimersByTime(1000);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
  
      jest.useRealTimers();
    });
  
    test('shows "Please enter a valid email address" when auth/invalid-email', async () => {
      loginUser.mockRejectedValue({
        name: 'FirebaseError',
        code: 'auth/invalid-email',
        message: 'Firebase: Error (auth/invalid-email).',
      });
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  
      await screen.findByText('Please enter a valid email address'); // setFailureMsg
    });
  
    test('shows invalid‑credential helper text', async () => {
      loginUser.mockRejectedValue({
        name: 'FirebaseError',
        code: 'auth/invalid-credential',
        message: 'Firebase: Error (auth/invalid-credential).',
      });
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  
      await screen.findByText(
        "Invalid email and/or password. Press Sign Up if you don't have an account!"
      );
    });
  
    test('Google login – new user goes to onboarding', async () => {
      loginGoogleUser.mockResolvedValue({
        isNewUser: true,
        user: { uid: 'uid42' },
      });
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.click(screen.getByRole('button', { name: /Login with/i }));
  
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding/uid42')
      );
    });
  
    test('Google login – existing user goes straight to /home', async () => {
      loginGoogleUser.mockResolvedValue({
        isNewUser: false,
        user: { uid: 'uid99' },
      });
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.click(screen.getByRole('button', { name: /Login with/i }));
  
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
    });
  
    test('toggles password visibility when eye icon is clicked', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      const pwdInput = screen.getByLabelText(/password/i, { selector: 'input' });
      const toggleBtn = screen.getByRole('button', { name: /toggle password visibility/i });

      // initial: hidden
      expect(pwdInput).toHaveAttribute('type', 'password');
      fireEvent.click(toggleBtn);
      expect(pwdInput).toHaveAttribute('type', 'text');
      fireEvent.click(toggleBtn);
      expect(pwdInput).toHaveAttribute('type', 'password');
    });
    test('sets success flag, clears failure, and redirects to /home after 1 s', async () => {
      jest.useFakeTimers();
      loginUser.mockResolvedValue({});
  
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.change(screen.getByLabelText(/email address/i, { selector: 'input' }), {
        target: { value: 'ok@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i,      { selector: 'input' }), {
        target: { value: 'goodpass' },
      });
  
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  
      await screen.findByText('Successfully signed in!');
      expect(
        screen.queryByText(/please enter a valid email address/i)
      ).toBeNull();
  
      jest.advanceTimersByTime(1000);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
  
      jest.useRealTimers();
    });
  
    test('setShowPassword(!showPassword) toggles input type', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      const pwdInput = screen.getByLabelText(/password/i, { selector: 'input' });
      const toggleBtn = screen.getByRole('button', {
        name: 'toggle password visibility',
      });
  
      expect(pwdInput).toHaveAttribute('type', 'password');
  
      fireEvent.click(toggleBtn);
      expect(pwdInput).toHaveAttribute('type', 'text');
  
      fireEvent.click(toggleBtn);
      expect(pwdInput).toHaveAttribute('type', 'password');
    });
  
    test('updates email and password state on every keystroke', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      const emailInput = screen.getByLabelText(/email address/i, { selector: 'input' });
      const pwdInput = screen.getByLabelText(/password/i, { selector: 'input' });
  
      fireEvent.change(emailInput, { target: { value: 'user@x.com' } });
      fireEvent.change(pwdInput,   { target: { value: 'secret' } });
  
      expect(emailInput).toHaveValue('user@x.com');
      expect(pwdInput).toHaveValue('secret');
    });
  
    test('clicking Sign up button navigates to /signup', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });
    test('clears previous failure and shows success then redirects on retry', async () => {
      jest.useFakeTimers();
      loginUser.mockRejectedValueOnce(new Error('first‑attempt‑failed'));
      loginUser.mockResolvedValueOnce({});
      expect(screen.queryByText('first‑attempt‑failed')).toBeNull();
      loginUser.mockResolvedValueOnce({});
      
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      await screen.findByText('first‑attempt‑failed');
  
      fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      const successAlert = await screen.findByText('Successfully signed in!');
      expect(successAlert).toBeInTheDocument();
      const oldError = screen.queryByText('first‑attempt‑failed');
      if (oldError) {
        expect(oldError).not.toBeVisible();
      }
  
      jest.advanceTimersByTime(1000);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
      jest.useRealTimers();
    });
  
    test('updates email state on change (setEmail)', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      const emailInput = screen.getByLabelText(/email address/i, { selector: 'input' });
      fireEvent.change(emailInput, { target: { value: 'foo@bar.com' } });
      expect(emailInput).toHaveValue('foo@bar.com');
    });
  
    test('updates password state on change (setPassword)', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
  
      const pwdInput = screen.getByLabelText(/password/i, { selector: 'input' });
      fireEvent.change(pwdInput, { target: { value: 'supersecret' } });
      expect(pwdInput).toHaveValue('supersecret');
    });
  });
  
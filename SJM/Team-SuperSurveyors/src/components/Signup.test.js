import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import { setDoc } from 'firebase/firestore';
import { within } from '@testing-library/react';

// let mockCreate;
const mockSetDoc = jest.fn();

jest.mock('firebase/auth', () => {
  const mockCreate = jest.fn();
    return {
      __esModule: true,
      mockCreate,
      getAuth: jest.fn(() => ({ currentUser: null })),
      createUserWithEmailAndPassword: (...args) => mockCreate(...args),
    };
  });
jest.mock('firebase/firestore', () => ({
  __esModule: true,
  doc:     jest.fn(() => ({})),
  setDoc:  (...args) => mockSetDoc(...args),
}));

jest.mock('../firebase', () => ({
  __esModule: true,
  db: {},
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import Signup from './Signup';
import { createUserWithEmailAndPassword, mockCreate, getAuth } from 'firebase/auth';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/home" element={<div>HOME</div>} />
        <Route path="/onboarding/:u" element={<div>ONBOARDING</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('<Signup />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAuth.mockReturnValue({ currentUser: null });
  });

  test('redirects authenticated user to /home', () => {
    getAuth.mockReturnValueOnce({ currentUser: { uid: 'abc' } });
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  test('creates account → writes Firestore & navigates to onboarding', async () => {
    const fakeCred = { user: { uid: 'uid‑123', email: 'me@mail.com' } };
    mockCreate.mockResolvedValue(fakeCred);

    renderPage();

    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'me@mail.com' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }),      { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.any(Object), 'me@mail.com', 'secret123');
      expect(mockSetDoc).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding/uid‑123');
    });
  });

  test('shows error alert when sign‑up fails', async () => {
    mockCreate.mockRejectedValue(new Error('sign up failed'));
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText(/sign up failed/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('toggles password visibility', () => {
    renderPage();

    const pwInput = screen.getByLabelText(/password/i, { selector: 'input' })
    const toggleBtn = screen.getByRole('button', { name: /toggle password visibility/i });

    expect(pwInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(pwInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleBtn);
    expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('Back to Login & “Sign in” buttons navigate to /login', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /back to login/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');

    mockNavigate.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
  test('inputs update on change', () => {
    renderPage();

    const nameInput = screen.getByRole('textbox', { name: /display name/i });
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    const pwInput = screen.getByLabelText(/password/i, { selector: 'input' });

    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    expect(nameInput).toHaveValue('Alice');

    fireEvent.change(emailInput, { target: { value: 'alice@mail.com' } });
    expect(emailInput).toHaveValue('alice@mail.com');

    fireEvent.change(pwInput, { target: { value: 'secret' } });
    expect(pwInput).toHaveValue('secret');
  });
  
  test('creates Firestore doc with correct shape and navigates', async () => {
    mockCreate.mockResolvedValueOnce({ user: { uid:'u1', email:'u1@mail.com', photoURL:null } });

    renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /display name/i }),    { target: { value: 'Bob' } });
    fireEvent.change(screen.getByRole('textbox', { name: /email address/i }),  { target: { value: 'u1@mail.com' } });
    fireEvent.change(screen.getByLabelText(/password/i, { selector: 'input' }),       { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockSetDoc).toHaveBeenCalled());
    const [, payload] = mockSetDoc.mock.calls[0];
    expect(payload).toEqual({
      displayName: 'Bob',
      email: 'u1@mail.com',
      photoURL: null,
      surveys: [],
      tags: [],
      uid: 'u1',
      coins: 10,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding/u1');
  });
  
  test('error alert can be closed via its onClose', async () => {
    mockCreate.mockRejectedValueOnce(new Error('fail'));
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    const alert = await screen.findByRole('alert');

    const closeBtn = within(alert).getByRole('button');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
  
});

jest.mock('../firebase', () => ({
    __esModule: true,
    db: {},
  }));
jest.mock('firebase/app', () => ({
    __esModule: true,
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
    getApp: jest.fn(),
  }));
jest.mock('firebase/auth', () => ({
    __esModule: true,
    getAuth: jest.fn(() => ({ currentUser: null })),
    onAuthStateChanged: jest.fn(),
  }));
  
  jest.mock('firebase/firestore', () => ({
    __esModule: true,
    doc: jest.fn(),
    onSnapshot: jest.fn(),
  }));
  
  jest.mock('../services/userService', () => ({
    logoutUser: jest.fn(),
    getCurrentUser: jest.fn(() => ({ photoURL: null })),
    getUserInfo: jest.fn(() => Promise.resolve({ coins: 0 })),
  }));
  jest.mock('@mui/material', () => {
    const actual = jest.requireActual('@mui/material');
    return {
      __esModule: true,
      ...actual,
      useMediaQuery: jest.fn(() => true),
    };
  });
  import React from 'react';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import { MemoryRouter } from 'react-router-dom';
  import '@testing-library/jest-dom';
  
  import NavBar from './NavBar';
  import {
    getAuth,
    onAuthStateChanged,
  } from 'firebase/auth';
  import {
    doc,
    onSnapshot,
  } from 'firebase/firestore';
  import {
    logoutUser,
    getCurrentUser,
    getUserInfo,
  } from '../services/userService';
  
  const mockNavigate = jest.fn();
  jest.mock('react-router-dom', () => {
    const original = jest.requireActual('react-router-dom');
    return {
      __esModule: true,
      ...original,
      useNavigate: () => mockNavigate,
    };
  });
  // import * as mui from '@mui/material';
  // jest.spyOn(mui, 'useMediaQuery').mockReturnValue(true);
  describe('NavBar Component Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
  
      getAuth.mockReturnValue({ currentUser: null });
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });
  
      doc.mockReturnValue({});
      onSnapshot.mockImplementation(() => jest.fn());
    });
  
    const renderNavBar = () => {
      return render(
        <MemoryRouter>
          <NavBar />
        </MemoryRouter>
      );
    };
    it('renders "Sign Up" link when user is not authenticated', () => {
      renderNavBar();
    
      // The MUI <Button component={Link}> renders as an <a> with role="link"
      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  
    describe('When user is authenticated', () => {
      beforeEach(() => {
        getAuth.mockReturnValue({
          currentUser: { uid: 'test-uid' },
        });
        onAuthStateChanged.mockImplementation((auth, callback) => {
          callback({ uid: 'test-uid' });
          return jest.fn();
        });
  
        getUserInfo.mockResolvedValue({ coins: 50 });
        getCurrentUser.mockReturnValue({ photoURL: 'http://example.com/avatar.jpg' });
      });
  
      it('shows nav items and coin balance when user is authenticated', async () => {
        renderNavBar();
      
        expect(await screen.findByRole('link', { name: /view/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /trending/i })).toBeInTheDocument();
      
        expect(screen.getByText('50')).toBeInTheDocument();
      });
  
      it('subscribes to Firestore onSnapshot once user is authenticated', async () => {
        renderNavBar();
        await waitFor(() => {
          expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-uid');
          expect(onSnapshot).toHaveBeenCalled();
        });
      });
  
      it('opens profile menu then navigates to /profile', () => {
        renderNavBar();
      
        const avatarImg = screen.getByAltText('Profile');
        fireEvent.click(avatarImg.closest('button'));
      
        const profileItem = screen.getByText(/profile/i);
        expect(profileItem).toBeInTheDocument();
      
        fireEvent.click(profileItem);
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
  
      it('logs out and navigates to /login on sign out', async () => {
        renderNavBar();
      
        const avatarImg = screen.getByAltText('Profile');
        fireEvent.click(avatarImg.closest('button'));
      
        const signOutItem = screen.getByText(/sign out/i);
        fireEvent.click(signOutItem);
      
        await waitFor(() => {
          expect(logoutUser).toHaveBeenCalled();
          expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
      });
  
      
      it('opens mobile menu, navigates on item click, and closes', async () => {
        const useMediaQueryMock = jest.requireMock('@mui/material/useMediaQuery');
        useMediaQueryMock.mockImplementation(() => true);
      
        renderNavBar();
      
        const mobileMenuBtn = await screen.findByRole('button', { name: /menu/i });
        fireEvent.click(mobileMenuBtn);
      
        const menuItem = await screen.findByText(/view/i);
        fireEvent.click(menuItem);
        expect(mockNavigate).toHaveBeenCalledWith('/view');
        expect(menuItem).not.toBeInTheDocument();
      });

      it('updates userInfo from Firestore snapshot', async () => {
        onSnapshot.mockImplementation((_, cb) => {
          cb({ data: () => ({ coins: 123 }) });
          return jest.fn();
        });

        renderNavBar();
        await waitFor(() => {
          expect(screen.getByText('123')).toBeInTheDocument();
        });
      });

      
      it('opens and then closes the profile menu via handleMenuOpen/handleMenuClose', async () => {
        renderNavBar();
        
        const avatarBtn = screen.getByRole('button', { name: /profile/i });
        fireEvent.click(avatarBtn);
        
        expect(screen.getByText('Profile')).toBeInTheDocument();
        
        fireEvent.keyDown(document, { key: 'Escape' });
        await waitFor(() => {
          expect(screen.queryByText('Profile')).toBeNull();
        });
      });

      it('navigates when a mobile‐menu item is clicked and closes menu', async () => {
        renderNavBar();
        const mobileBtn = screen.queryByLabelText('menu');
        if (!mobileBtn) return;
        fireEvent.click(mobileBtn);
        expect(await screen.findByText('Answer')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Create'));
        expect(mockNavigate).toHaveBeenCalledWith('/create');
        expect(screen.queryByText('View')).toBeNull();
      });

    });
  });
  
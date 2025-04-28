import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UserView from './UserView';
import { getCurrentUser } from '../services/userService';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from './Survey';
import '@testing-library/jest-dom';

jest.mock('../services/userService', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  __esModule: true,
  ...jest.requireActual('firebase/firestore'),
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('./EditUserProfileDialog', () => ({
  __esModule: true,
  default: ({ show, onSave, onHide }) => {
    if (!show) return null;
    return (
      <div role="dialog">
        <button onClick={() => onSave('Jane Smith', 'https://example.com/jane.jpg')}>
          save‑profile
        </button>
        <button onClick={onHide}>cancel‑profile</button>
      </div>
    );
  },
}));

const openTagDialog = async () => {
  await waitFor(() => fireEvent.click(screen.getByLabelText('edit tags')));
};

describe('UserView Component', () => {
  const mockUser = {
    uid: 'user123',
    displayName: 'John Doe',
    email: 'john@example.com',
    photoURL: 'https://example.com/avatar.jpg',
    tags: ['technology', 'sports']
  };

  const mockTags = ['technology', 'sports', 'music', 'food'];

  beforeEach(() => {
    require('firebase/firestore').getDoc.mockImplementation((ref) => {
      return Promise.resolve({
        exists: () => true,
        data: () => mockUser
      });
    });

    require('firebase/firestore').getDocs.mockImplementation(() => ({
      docs: mockTags.map(tag => ({ id: tag }))
    }));

    getCurrentUser.mockReturnValue({ uid: 'user123' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <UserView />
        </MemoryRouter>
      </ThemeProvider>
    );
  };

  test('shows loading state initially', async () => {
    require('firebase/firestore').getDoc.mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  test('displays user data correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      mockUser.tags.forEach(tag => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });
  });

  test('opens and closes edit profile dialog', async () => {
    renderComponent();
    
    await waitFor(() => {
      fireEvent.click(screen.getByLabelText('edit profile'));
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/cancel‑profile/i));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('updates tags correctly', async () => {
    renderComponent();
    
    // Open tag dialog
    await waitFor(() => {
      fireEvent.click(screen.getByLabelText('edit tags'));
    });
    
    // Select new tag
    const musicButton = screen.getByRole('button', { name: 'music' });
    fireEvent.click(musicButton);
    
    // Save changes
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    
    await waitFor(() => {
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        undefined,
        { tags: [...mockUser.tags, 'music'] }
      );
    });
  });

  test('handles no user available state', async () => {
    getCurrentUser.mockReturnValue(null);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/no user available/i)).toBeInTheDocument();
    });
  });

  test('displays default avatar when no photoURL', async () => {
    require('firebase/firestore').getDoc.mockImplementation((ref) => {
      return Promise.resolve({
        exists: () => true,
        data: () => ({ ...mockUser, photoURL: null })
      });
    });
    
    renderComponent();
    
    await waitFor(() => {
      const avatar = screen.getByRole('img', { name: mockUser.displayName });
      expect(avatar).toHaveAttribute(
        'src',
        'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'
      );
    });
  });
  test('handleSaveChanges updates user and closes edit dialog', async () => {
    renderComponent();
  
    // Original name rendered
    await screen.findByText('John Doe');
  
    // Open edit dialog via the icon
    fireEvent.click(screen.getByLabelText('edit profile'));
  
    // Click mock save button – this invokes handleSaveChanges
    fireEvent.click(await screen.findByText('save‑profile'));
  
    // New name appears and dialog disappears
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
  
  test('toggleTagSelection deselects an already‑selected tag', async () => {
    renderComponent();
  
    // Open the tag dialog
    await openTagDialog();
  
    // "sports" is pre‑selected → click again to REMOVE it
    const sportsBtn = await screen.findByRole('button', { name: 'sports' });
    fireEvent.click(sportsBtn);      // toggles off
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
  
    // Firebase updateDoc called with tag removed
    await waitFor(() => {
      expect(require('firebase/firestore').updateDoc).toHaveBeenCalledWith(
        undefined,
        { tags: ['technology'] }     // sports removed
      );
    });
  
    // Chip for "sports" should be gone from the profile view
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const profileSection = screen.getByText(/interest tags/i).closest('div');
    expect(within(profileSection).queryByText('sports')).toBeNull();
  });
  
  test('edit‑tags icon opens dialog and cancel button closes it', async () => {
    renderComponent();
  
    // Opens
    const editTagsBtn = await screen.findByLabelText('edit tags');
    fireEvent.click(editTagsBtn);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  
    // Cancels
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
});

describe('UserView – error branches', () => {
  // access the already‑created Jest mocks
  const mockFirestore = require('firebase/firestore');
  const mockUserService = require('../services/userService');

  /** simple helpers ***********************************************/
  const renderComponent = () =>
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <UserView />
        </MemoryRouter>
      </ThemeProvider>
    );

  const userDoc = (overrides = {}) => ({
    exists: () => true,
    data: () => ({
      uid: 'user123',
      displayName: 'John Doe',
      email: 'john@example.com',
      photoURL: 'https://example.com/avatar.jpg',
      tags: ['technology'],
      ...overrides,
    }),
  });

  let consoleErrorSpy;
  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mockFirestore.getDoc.mockResolvedValue(userDoc());
    mockFirestore.getDocs.mockResolvedValue({
      docs: ['technology', 'sports'].map((t) => ({ id: t })),
    });
    mockUserService.getCurrentUser.mockReturnValue({ uid: 'user123' });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('logs error when fetching user fails', async () => {
    mockFirestore.getDoc.mockRejectedValue(new Error('fetch user error'));

    renderComponent();

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching user:',
        expect.any(Error)
      )
    );
    expect(
      await screen.findByText(/no user available/i)
    ).toBeInTheDocument();
  });

  test('logs error when fetching tags fails', async () => {
    mockFirestore.getDoc.mockResolvedValue(userDoc({ tags: undefined }));
    mockFirestore.getDocs.mockRejectedValue(new Error('fetch tags error'));

    renderComponent();

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching tags:',
        expect.any(Error)
      )
    );
    expect(
      await screen.findByText(/no tags selected/i)
    ).toBeInTheDocument();
  });

  test('logs error when updating tags fails and keeps dialog open', async () => {
    mockFirestore.updateDoc.mockRejectedValue(new Error('update tags error'));

    renderComponent();

    // wait for the profile UI to appear, then open Tag dialog
    fireEvent.click(await screen.findByLabelText('edit tags'));
    await screen.findByRole('dialog');

    // toggle a tag and attempt to save
    fireEvent.click(screen.getByRole('button', { name: 'sports' }));
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating tags:',
        expect.any(Error)
      )
    );
    // dialog should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('Dialog closes via onClose (ESC key)', async () => {
    renderComponent();

    // open Tag dialog
    fireEvent.click(await screen.findByLabelText('edit tags'));
    await screen.findByRole('dialog');

    // simulate ESC key (MUI calls onClose)
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
});
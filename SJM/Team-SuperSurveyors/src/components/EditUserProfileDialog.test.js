jest.mock('@mui/material', () => {
  const React = require('react');
  
  const TextField = ({ label, value, onChange, ...props }) => (
    <div data-testid="mui-textfield" {...props}>
      <label htmlFor="mock-text-field">{label}</label>
      <input
        id="mock-text-field"
        value={value}
        onChange={(e) => onChange && onChange(e)}
        data-testid="mock-text-input"
      />
    </div>
  );

  const createMockComponent = (name) => {
    const Component = ({ children, ...props }) => (
      <div data-testid={`mui-${name.toLowerCase()}`} {...props}>
        {children}
      </div>
    );
    Component.displayName = name;
    return Component;
  };

  return {
    __esModule: true,
    TextField,
    Dialog: createMockComponent('Dialog'),
    DialogTitle: createMockComponent('DialogTitle'),
    DialogContent: createMockComponent('DialogContent'),
    DialogActions: createMockComponent('DialogActions'),
    Button: createMockComponent('Button'),
    Box: createMockComponent('Box'),
    Typography: createMockComponent('Typography'),
    IconButton: createMockComponent('IconButton'),
    Avatar: createMockComponent('Avatar'),
    Divider: createMockComponent('Divider'),
    Stack: createMockComponent('Stack'),
    CircularProgress: createMockComponent('CircularProgress'),
    Slide: React.forwardRef((props, ref) => (
      <div ref={ref} data-testid="mui-slide" {...props}>
        {props.children}
      </div>
    ))
  };
});
jest.mock('@mui/material/styles', () => {
  const originalModule = jest.requireActual('@mui/material/styles');
  
  return {
    ...originalModule,
    styled: (Component) => (props) => {
      const StyledComponent = ({children, ...rest}) => (
        <Component {...props} {...rest}>{children}</Component>
      );
      return StyledComponent;
    },
    createTheme: jest.fn(() => ({})),
    ThemeProvider: ({children}) => <>{children}</>
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';
import EditUserProfileDialog from './EditUserProfileDialog';
import { updateUserProfile } from '../services/userService';
const theme = createTheme();

jest.mock('@mui/icons-material/Close', () => ({
  __esModule: true,
  default: function CloseIcon() { return <div data-testid="close-icon" />; }
}));

jest.mock('@mui/icons-material/AccountCircle', () => ({
  __esModule: true,
  default: function AccountCircleIcon() { return <div data-testid="account-circle-icon" />; }
}));
  



jest.mock('../services/userService', () => ({
  updateUserProfile: jest.fn(),
}));

jest.mock('../services/uploadService', () => {
    const React = require('react');
    const UploadWidget = ({ onUpload }) => (
      <button
        data-testid="upload-button"
        onClick={() => onUpload('new-avatar.jpg')}
      >
        Upload Photo
      </button>
    );
  
    return {
      __esModule: true,
      UploadWidget,
      default: UploadWidget,
    };
  });

describe('EditUserProfileDialog', () => {
  const mockProps = {
    show: true,
    onHide: jest.fn(),
    userId: 'user-123',
    displayName: 'John Doe',
    photoURL: 'avatar.jpg',
    onDisplayNameChange: jest.fn(),
    onPhotoURLChange: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    updateUserProfile.mockResolvedValue({
      displayName: 'Updated Name',
      photoURL: 'new-avatar.jpg'
    });
  });

  const renderProfileDialog = (extraProps = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <EditUserProfileDialog {...mockProps} {...extraProps} />
      </ThemeProvider>
    );
  };

  test('renders dialog with initial user data', () => {
    renderProfileDialog();
    
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByTestId('mui-avatar')).toHaveAttribute('src', 'avatar.jpg');
  });

  test('updates display name when input changes', () => {
    renderProfileDialog();
    
    const nameInput = screen.getByLabelText('Display Name');
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    
    expect(mockProps.onDisplayNameChange).toHaveBeenCalledWith('Jane Smith');
  });

  test('updates photo URL when image is uploaded', () => {
    renderProfileDialog();
    
    fireEvent.click(screen.getByTestId('upload-button'));
    expect(mockProps.onPhotoURLChange).toHaveBeenCalledWith('new-avatar.jpg');
  });

  test('saves changes successfully', async () => {
    renderProfileDialog();
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        'John Doe',
        'avatar.jpg'
      );
      expect(mockProps.onSave).toHaveBeenCalledWith('Updated Name', 'new-avatar.jpg');
      expect(mockProps.onHide).toHaveBeenCalled();
    });
  });

  test('shows loading state during save', async () => {
    renderProfileDialog();
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    const saveButton = screen.getByText('Save Changes').closest('button');
    expect(saveButton).toHaveAttribute('disabled');
  });

  test('displays error message on save failure', async () => {
    updateUserProfile.mockRejectedValue(new Error('Update failed'));
    renderProfileDialog();
    
    fireEvent.click(screen.getByText('Save Changes'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });

  test('handles enter key submission', async () => {
    renderProfileDialog();
    
    const nameInput = screen.getByLabelText('Display Name');
    fireEvent.keyDown(nameInput, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalled();
    });
  });

  test('handles cancel action', () => {
    renderProfileDialog();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockProps.onHide).toHaveBeenCalled();
  });

  test('shows default avatar when no photo URL', () => {
    const propsWithoutPhoto = { 
      ...mockProps, 
      photoURL: null 
    };
    
    render(
      <ThemeProvider theme={theme}>
        <EditUserProfileDialog {...propsWithoutPhoto} />
      </ThemeProvider>
    );
  
    expect(screen.queryByTestId('mui-avatar')).not.toHaveAttribute('src');
    expect(screen.getByTestId('account-circle-icon')).toBeInTheDocument();
  });

  test('on success: sets loading, clears error, calls API, then onSave & onHide and clears loading', async () => {
    updateUserProfile.mockResolvedValue({
      displayName: 'Updated Name',
      photoURL: 'new-avatar.jpg',
    });

    renderProfileDialog();

    fireEvent.click(screen.getByText('Save Changes'));

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith(
        'user-123',
        'John Doe',
        'avatar.jpg'
      );
      expect(mockProps.onSave).toHaveBeenCalledWith('Updated Name', 'new-avatar.jpg');
      expect(mockProps.onHide).toHaveBeenCalled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      const saveButton = screen.getByText('Save Changes').closest('button');
      expect(saveButton).not.toHaveAttribute('disabled');
      expect(screen.queryByText(/failed to update profile/i)).toBeNull();
    });
  });

  test('on failure: sets loading, enters catch to set error, and finally clears loading', async () => {
    updateUserProfile.mockRejectedValue(new Error('boom'));

    renderProfileDialog();

    fireEvent.click(screen.getByText('Save Changes'));

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledTimes(1);
      expect(mockProps.onSave).not.toHaveBeenCalled();
      expect(mockProps.onHide).not.toHaveBeenCalled();
      expect(
        screen.getByText('Failed to update profile. Please try again.')
      ).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      const saveButton = screen.getByText('Save Changes').closest('button');
      expect(saveButton).not.toHaveAttribute('disabled');
    });
  });
  test('ignores non‑Enter key presses in the input field', () => {
    renderProfileDialog();
  
    fireEvent.keyDown(screen.getByLabelText('Display Name'), {
      key: 'a',
      code: 'KeyA',
    });
  
    expect(updateUserProfile).not.toHaveBeenCalled();
  });
  
  test('does not trigger a second save on Enter when loading', () => {
    updateUserProfile.mockImplementation(
      () => new Promise(() => {})
    );
  
    renderProfileDialog();
  
    // first click → sets isLoading = true
    fireEvent.click(screen.getByText('Save Changes'));
    expect(updateUserProfile).toHaveBeenCalledTimes(1);
  
    // second Enter key press should be ignored because isLoading === true
    fireEvent.keyDown(screen.getByLabelText('Display Name'), {
      key: 'Enter',
      code: 'Enter',
    });
  
    expect(updateUserProfile).toHaveBeenCalledTimes(1);
  });
  
  test('calls onDisplayNameChange for every edit', () => {
    renderProfileDialog();
    
    const input = screen.getByTestId('mock-text-input');
    
    fireEvent.change(input, { target: { value: 'J' } });
    fireEvent.change(input, { target: { value: 'Jo' } });
    fireEvent.change(input, { target: { value: 'Joh' } });
  
    expect(mockProps.onDisplayNameChange).toHaveBeenCalledTimes(3);
    expect(mockProps.onDisplayNameChange).toHaveBeenNthCalledWith(1, 'J');
    expect(mockProps.onDisplayNameChange).toHaveBeenNthCalledWith(2, 'Jo');
    expect(mockProps.onDisplayNameChange).toHaveBeenNthCalledWith(3, 'Joh');
  });
});

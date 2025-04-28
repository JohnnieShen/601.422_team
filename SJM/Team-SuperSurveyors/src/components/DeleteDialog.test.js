import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteConfirmationDialog from './DeleteDialog';

jest.mock('firebase/firestore', () => ({
  __esModule: true,
  deleteDoc: jest.fn(),
  doc: jest.fn((db, collection, id) => ({ id })),
}));

jest.mock('../firebase', () => ({
  __esModule: true,
  db: {},
}));

describe('DeleteConfirmationDialog', () => {
  const mockSurvey = {
    id: 'survey-123',
    title: 'Test Survey',
  };

  const mockProps = {
    show: true,
    onHide: jest.fn(),
    survey: mockSurvey,
    onSurveyDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deletes survey when survey prop is provided', async () => {
    const { deleteDoc } = require('firebase/firestore');
    deleteDoc.mockResolvedValueOnce();

    render(<DeleteConfirmationDialog {...mockProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => expect(deleteButton).toBeDisabled());

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith(expect.objectContaining({ id: 'survey-123' }));
      expect(mockProps.onSurveyDelete).toHaveBeenCalledWith('survey-123');
      expect(mockProps.onHide).toHaveBeenCalled();
    });
  });

  test('does not call deleteDoc when survey prop is not provided', () => {
    const { deleteDoc } = require('firebase/firestore');
    
    render(<DeleteConfirmationDialog {...mockProps} survey={null} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(deleteDoc).not.toHaveBeenCalled();
    expect(mockProps.onSurveyDelete).not.toHaveBeenCalled();
    expect(mockProps.onHide).not.toHaveBeenCalled();
  });

  test('handles errors gracefully when deletion fails', async () => {
    const { deleteDoc } = require('firebase/firestore');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Deletion failed');
    deleteDoc.mockRejectedValueOnce(error);

    render(<DeleteConfirmationDialog {...mockProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalled();
      expect(deleteButton).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });

  test('shows loading state during deletion', async () => {
    const { deleteDoc } = require('firebase/firestore');
    deleteDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DeleteConfirmationDialog {...mockProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteButton).toBeDisabled();
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });
  });
});
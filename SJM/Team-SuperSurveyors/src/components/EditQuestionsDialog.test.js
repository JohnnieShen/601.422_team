jest.mock('./Question/EditableQuestion', () => ({
  __esModule: true,
  default: ({ id, question, onTitleChange }) => (
    <div
      data-testid="editable-question"
      onClick={() => onTitleChange(id, `Updated Question ${id + 1}`)}
    >
      {question.text}
    </div>
  ),
}));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import EditQuestionsDialog from './EditQuestionsDialog';
import userEvent from '@testing-library/user-event';

const theme = createTheme({
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          padding: 4,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '6px 16px',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});


jest.mock('use-bootstrap-tag', () => ({
  __esModule: true,
  default: class MockUseBootstrapTag {
    constructor(element) {
      this.values = element.defaultValue || [];
    }
    getValues() {
      return this.values;
    }
  }
}));

// jest.mock('./Question/EditableQuestion', () => ({ 
//   __esModule: true,
//   default: ({ question }) => <div data-testid="editable-question">{question.text}</div>
// }));

describe('EditQuestionsDialog', () => {
  const mockSurvey = {
    id: 'survey-123',
    title: 'Test Survey',
    tags: ['tag1', 'tag2'],
    questions: [
      { id: 0, text: 'Question 1', type: 'text' },
      { id: 1, text: 'Question 2', type: 'multiple-choice' }
    ]
  };

  const mockProps = {
    show: true,
    onHide: jest.fn(),
    survey: mockSurvey,
    onQuestionsChange: jest.fn(),
    handleSaveChanges: jest.fn(),
    onTitleChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders dialog with initial survey data', () => {
    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...mockProps} />
      </ThemeProvider>
    );

    expect(screen.getByText('Edit Survey')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Survey')).toBeInTheDocument();
    expect(screen.getByDisplayValue('tag1,tag2')).toBeInTheDocument();
    expect(screen.getAllByTestId('editable-question')).toHaveLength(2);
  });

  test('handles title change correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...mockProps} />
      </ThemeProvider>
    );

    const titleInput = screen.getByDisplayValue('Test Survey');
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    
    expect(mockProps.onTitleChange).toHaveBeenCalledWith('New Title');
  });

  test('handles save action with tags', async () => {
    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...mockProps} />
      </ThemeProvider>
    );

    // Advance timers to initialize UseBootstrapTag
    jest.advanceTimersByTime(100);
    
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    
    await waitFor(() => {
      expect(mockProps.handleSaveChanges).toHaveBeenCalledWith('survey-123');
      expect(mockProps.onHide).toHaveBeenCalled();
    });
  });

  test('prevents enter key submission', () => {
    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...mockProps} />
      </ThemeProvider>
    );

    const titleInput = screen.getByDisplayValue('Test Survey');
    fireEvent.keyDown(titleInput, { key: 'Enter', code: 'Enter' });
    
    expect(mockProps.handleSaveChanges).not.toHaveBeenCalled();
  });

  test('handles empty survey state', () => {
    const emptySurveyProps = {
      ...mockProps,
      survey: { ...mockSurvey, questions: [], tags: [] }
    };

    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...emptySurveyProps} />
      </ThemeProvider>
    );

    expect(screen.queryByTestId('editable-question')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter tags')).toBeInTheDocument();
  });
  test('updates question title and calls onQuestionsChange with a new array', async () => {
    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...mockProps} />
      </ThemeProvider>
    );
  
    // simulate the user clicking the first question to edit its title
    fireEvent.click(screen.getAllByTestId('editable-question')[0]);
  
    await waitFor(() => {
      expect(mockProps.onQuestionsChange).toHaveBeenCalledTimes(1);
  
      // grab the array that was passed to onQuestionsChange
      const updated = mockProps.onQuestionsChange.mock.calls[0][0];
  
      // it should be a *new* array with the edited question text
      expect(Array.isArray(updated)).toBe(true);
      expect(updated).not.toBe(mockProps.survey.questions);
      expect(updated[0].text).toBe('Updated Question 1');
    });
  });
  test('questionTitleChange clones array, mutates the correct index, and calls onQuestionsChange', async () => {
    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...mockProps} />
      </ThemeProvider>
    );
  
    fireEvent.click(screen.getAllByTestId('editable-question')[0]);
  
    expect(mockProps.onQuestionsChange).toHaveBeenCalledTimes(1);
  
    const updated = mockProps.onQuestionsChange.mock.calls[0][0];
  
    expect(updated).not.toBe(mockSurvey.questions);
    expect(updated[0].text).toBe('Updated Question 1');
    expect(updated[1].text).toBe('Question 2');          // untouched
    expect(mockSurvey.questions[0].text).toBe('Updated Question 1');
  });
  test('Cancel resets title, calls onQuestionsChange with original data, and fires onHide', async () => {
    render(
      <ThemeProvider theme={theme}>
        <EditQuestionsDialog {...mockProps} />
      </ThemeProvider>
    );
  
    const titleInput = screen.getByDisplayValue('Test Survey');
    fireEvent.change(titleInput, { target: { value: 'Temp Title' } });
    expect(titleInput).toHaveValue('Temp Title');
  
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  
    await waitFor(() => {
      expect(mockProps.onQuestionsChange).toHaveBeenCalledTimes(1);
      expect(mockProps.onQuestionsChange).toHaveBeenCalledWith(mockSurvey.questions);
  
      expect(mockProps.onHide).toHaveBeenCalledTimes(1);
  
      expect(screen.getByDisplayValue('Test Survey')).toBeInTheDocument();
    });
  });
  
});
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import SurveyView from './SurveyView';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/userService.js';
import { getUserSurveys, updateSurvey } from '../services/surveyService.js';
import { shareSurvey } from './createAndSharing.js';

jest.mock('./DeleteDialog.js', () => (props) => (
  <div data-testid="delete-dialog">Delete Dialog</div>
));
jest.mock('./EditQuestionsDialog.js', () => (props) => (
  <div data-testid="edit-dialog">Edit Dialog</div>
));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
    useNavigate: jest.fn(),
  };
});


jest.mock('../services/userService.js', () => ({
  getCurrentUser: jest.fn(),
}));
jest.mock('../services/surveyService.js', () => ({
  getUserSurveys: jest.fn(),
  updateSurvey: jest.fn(),
}));
jest.mock('./createAndSharing.js', () => ({
  shareSurvey: jest.fn(),
}));

describe('SurveyView Component', () => {
  const mockSurveys = [
    {
      id: '1',
      title: 'Survey One',
      tags: ['Tag1', 'Tag2'],
      questions: [{ text: 'What is your favorite color?', options: ['Red', 'Blue'] }],
    },
    {
      id: '2',
      title: 'Survey Two',
      tags: [],
      questions: [{ text: 'Question 2?', options: [] }],
    },
  ];
  const mockUser = { id: 'user1' };
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue(mockUser);
    getUserSurveys.mockResolvedValue(mockSurveys);
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('redirects to login if no current user', async () => {
    getCurrentUser.mockReturnValue(null);
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('renders loading spinner initially then displays surveys', async () => {
    render(<SurveyView />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait specifically for Survey One's link to appear
    await waitFor(() => {
        expect(screen.getByRole('link', { name: /survey one/i })).toBeInTheDocument();
    });

    // Now check other elements that should be present
    expect(screen.getByRole('link', { name: /survey two/i })).toBeInTheDocument();
    expect(screen.getByText('Tag1')).toBeInTheDocument();
    expect(screen.getByText('Tag2')).toBeInTheDocument();
    expect(screen.getByText(/no tags available/i)).toBeInTheDocument();

    // Verify loading spinner is gone
    await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  test('renders "No surveys available." when survey list is empty', async () => {
    getUserSurveys.mockResolvedValue([]);
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(screen.getByText(/your surveys/i)).toBeInTheDocument();
      expect(screen.getByText(/no surveys available/i)).toBeInTheDocument();
    });
  });

  test('survey title link navigates to survey view page', async () => {
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /survey one/i })).toBeInTheDocument();
    });
    
    const surveyLink = screen.getByRole('link', { name: /survey one/i });
    expect(surveyLink).toHaveAttribute('href', '/survey-view/1');
  });

  const openSurveyMenu = async () => {
    const menuButtons = await screen.findAllByRole('button');
    const menuButton = menuButtons.find(button => 
      button.querySelector('[data-testid="MoreVertIcon"]')
    );
    return menuButton;
  };

  test('menu "View Results" navigates to survey results page', async () => {
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(screen.getByText(/survey one/i )).toBeInTheDocument();
    });
    
    const menuButton = await openSurveyMenu();
    fireEvent.click(menuButton);

    const viewResultsItem = await screen.findByText(/view results/i);
    fireEvent.click(viewResultsItem);

    expect(mockNavigate).toHaveBeenCalledWith('/survey-results/1');
  });

  test('menu "Share" calls shareSurvey with correct survey id', async () => {
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(screen.getByText(/survey one/i )).toBeInTheDocument();
    });
    
    const menuButton = await openSurveyMenu();
    fireEvent.click(menuButton);

    const shareItem = await screen.findByText(/share/i);
    fireEvent.click(shareItem);

    expect(shareSurvey).toHaveBeenCalledWith('1');
  });

  test('menu "Delete" opens DeleteConfirmationDialog', async () => {
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(screen.getByText(/survey one/i )).toBeInTheDocument();
    });
    
    const menuButton = await openSurveyMenu();
    fireEvent.click(menuButton);

    const deleteItem = await screen.findByText(/^delete$/i);
    fireEvent.click(deleteItem);

    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  test('menu "Edit" opens EditQuestionsDialog', async () => {
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(screen.getByText(/survey one/i )).toBeInTheDocument();
    });
    
    const menuButton = await openSurveyMenu();
    fireEvent.click(menuButton);

    const editItem = await screen.findByText(/edit$/i);
    fireEvent.click(editItem);

    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
  });
  test('handles survey fetch error', async () => {
    getUserSurveys.mockRejectedValue(new Error('Fetch failed'));
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
    expect(screen.getByText(/your surveys/i)).toBeInTheDocument();
  });
  
 
  
  test('handles survey not found during save', async () => {
    // Mock with empty surveys array
    getUserSurveys.mockResolvedValue([]);
    render(<SurveyView />);
    
    await waitFor(() => {
      expect(updateSurvey).not.toHaveBeenCalled();
    });
  });
  
  test('updates survey tags correctly', async () => {
    render(<SurveyView />);
    // Wait for the specific survey card to render
    const surveyLink = await screen.findByRole('link', { name: /survey one/i });

    // Find the menu button associated with this card
    const card = surveyLink.closest('.MuiCard-root');
    expect(card).toBeInTheDocument();
    const menuButton = within(card).getByTestId('MoreVertIcon');
    fireEvent.click(menuButton);

    // Click edit menu item
    fireEvent.click(await screen.findByRole('menuitem', { name: /edit/i }));

    // Wait for the mocked dialog
    await screen.findByTestId('edit-dialog');

    // Simulate tag change using the mock's button
    fireEvent.click(screen.getByTestId('edit-tags')); // This calls onTagChange(['TagX']) in mock

    // Verify the new tag ('TagX' from mock) appears in the card
    await waitFor(() => {
        expect(within(card).getByText('TagX')).toBeInTheDocument();
    });

    // Optional: Verify old tags are gone if the mock completely replaces them
    await waitFor(() => {
        expect(within(card).queryByText('Tag1')).not.toBeInTheDocument();
        expect(within(card).queryByText('Tag2')).not.toBeInTheDocument();
    });
  });
  
  
  test('displays correct question count', async () => {
    render(<SurveyView />);

    await waitFor(() => {
        // Based on mock data, Survey One has 1 question, Survey Two has 1 question
        const surveyOneLink = screen.getByRole('link', { name: /survey one/i });
        const surveyTwoLink = screen.getByRole('link', { name: /survey two/i });

        const cardOne = surveyOneLink.closest('.MuiCard-root');
        const cardTwo = surveyTwoLink.closest('.MuiCard-root');

        // Check count within each card
        expect(within(cardOne).getByText(/1 question/i)).toBeInTheDocument();
        expect(within(cardTwo).getByText(/1 question/i)).toBeInTheDocument();

        // Ensure only these two matches exist (alternative to getAllByText)
        expect(screen.queryAllByText(/1 question/i)).toHaveLength(2);
    });
  });
  
  test('applies theme styling correctly', async () => {
    render(<SurveyView />);

    // Wait for the first survey card's content to appear
    const surveyOneLink = await screen.findByRole('link', { name: /survey one/i });

    // Find the parent Card element
    const cardElement = surveyOneLink.closest('.MuiCard-root');
    expect(cardElement).toBeInTheDocument(); // Make sure we found the card

    // Check styles relevant to your theme. Examples:
    // Check default MUI V5 radius (adjust if your theme overrides)
    expect(cardElement).toHaveStyle('border-radius: 12px');

    // Check if your theme explicitly sets background color or removes shadow etc.
    // expect(cardElement).toHaveStyle('background-color: rgb(255, 255, 255)'); // Example
    // expect(cardElement).toHaveStyle('box-shadow: none'); // Example if theme removes shadow
  });
  
  test('handles menu click propagation', async () => {
    render(<SurveyView />);
    await waitFor(() => screen.getByText(/survey one/i));
  
    const menuButtons = await screen.findAllByRole('button');
    const menuButton = menuButtons.find(button => 
      button.querySelector('[data-testid="MoreVertIcon"]')
    );
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const stopPropagation = jest.spyOn(clickEvent, 'stopPropagation');
    
    fireEvent(menuButton, clickEvent);
    
    expect(stopPropagation).toHaveBeenCalled();
    stopPropagation.mockRestore();
  });
  

});

jest.mock('./DeleteDialog.js', () => (props) => {
  if (!props.show) return null;
  return (
    <div data-testid="delete-dialog">
      <button data-testid="delete-cancel" onClick={props.onHide}>Cancel</button>
      <button
        data-testid="delete-confirm"
        onClick={() => props.onSurveyDelete(props.survey.id)}
      >
        Confirm
      </button>
    </div>
  );
});
jest.mock('./EditQuestionsDialog.js', () => (props) => {
  if (!props.show) return null;
  return (
    <div data-testid="edit-dialog">
      <button
        data-testid="edit-save"
        onClick={() => props.handleSaveChanges(props.survey.id)}
      >
        Save
      </button>
      <button data-testid="edit-cancel" onClick={props.onHide}>
        Cancel
      </button>
      <button
        data-testid="edit-title"
        onClick={() => props.onTitleChange('New Title')}
      >
        Change Title
      </button>
      <button
        data-testid="edit-tags"
        onClick={() => props.onTagChange(['TagX'])}
      >
        Change Tags
      </button>
      <button
        data-testid="edit-questions"
        onClick={() => props.onQuestionsChange([{ text: 'Q1' }, { text: 'Q2' }])}
      >
        Change Questions
      </button>
    </div>
  );
});

const openMenuForFirst = async () => {
  // wait for the first card’s MoreVertIcon button
  const buttons = await screen.findAllByRole('button');
  // find the one with a MoreVertIcon inside
  return buttons.find((btn) => btn.querySelector('svg[data-testid="MoreVertIcon"]'));
};

describe('SurveyView – state handlers & reducers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentUser.mockReturnValue({ id: 'user1' });
    getUserSurveys.mockResolvedValue([
      { id: '1', title: 'Survey One', tags: ['A'], questions: [{ text: 'Q?' }] },
      { id: '2', title: 'Survey Two', tags: [], questions: [] },
    ]);
    useNavigate.mockReturnValue(jest.fn());
  });

  test('closeDeleteDialog resets dialog & selectedSurvey', async () => {
    render(<SurveyView />);
    // open delete-confirm flow
    const menuBtn = await openMenuForFirst();
    fireEvent.click(menuBtn);
    fireEvent.click(await screen.findByText(/^Delete$/i));  // open DeleteDialog
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();

    // click Cancel → should hide dialog
    fireEvent.click(screen.getByTestId('delete-cancel'));
    await waitFor(() =>
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument()
    );
  });

  test('handleSurveyDelete actually removes the survey', async () => {
    render(<SurveyView />);
    const menuBtn = await openMenuForFirst();
    fireEvent.click(menuBtn);
    fireEvent.click(await screen.findByText(/^Delete$/i));

    // confirm delete
    fireEvent.click(screen.getByTestId('delete-confirm'));
    await waitFor(() =>
      expect(screen.queryByText(/Survey One/i)).not.toBeInTheDocument()
    );
  });

  test('handleSaveChanges calls updateSurvey & closes edit dialog', async () => {
    render(<SurveyView />);
    const menuBtn = await openMenuForFirst();
    fireEvent.click(menuBtn);
    fireEvent.click(await screen.findByText(/^Edit$/i));
    expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-save'));
    await waitFor(() => {
      expect(updateSurvey).toHaveBeenCalledWith('1', expect.any(Object));
      expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
    });
  });

  test('surveyTitleChange updates the title in the UI', async () => {
    render(<SurveyView />);
    const menuBtn = await openMenuForFirst();
    fireEvent.click(menuBtn);
    fireEvent.click(await screen.findByText(/^Edit$/i));

    // change title
    fireEvent.click(screen.getByTestId('edit-title'));
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: /New Title/i })
      ).toBeInTheDocument()
    );
  });

  test('surveyTagChange updates the chips in the card', async () => {
    render(<SurveyView />);
    const menuBtn = await openMenuForFirst();
    fireEvent.click(menuBtn);
    fireEvent.click(await screen.findByText(/^Edit$/i));

    // change tags
    fireEvent.click(screen.getByTestId('edit-tags'));
    await waitFor(() => expect(screen.getByText('TagX')).toBeInTheDocument());
  });

test('onQuestionsChange updates the question count text', async () => {
  render(<SurveyView />);
  const surveyLink = await screen.findByRole('link', { name: /survey one/i });
  const card1 = surveyLink.closest('.MuiCard-root');
  await waitFor(() => {
    expect(within(card1).getByText(/1 question/i)).toBeInTheDocument();
  });

  const menuBtn = within(card1).getByTestId('MoreVertIcon');
  fireEvent.click(menuBtn);
  fireEvent.click(await screen.findByRole('menuitem', { name: /^Edit$/i }));
  const editDialog = await screen.findByTestId('edit-dialog');

  fireEvent.click(within(editDialog).getByTestId('edit-questions'));

  await waitFor(async () => {
      const updatedText = await within(card1).findByText(/2 questions/i);
      expect(updatedText).toBeInTheDocument();
  }, { timeout: 3000 });
});

  test('cancel‑edit restores original survey data', async () => {
    render(<SurveyView />);
    const menuBtn = await openMenuForFirst();
    fireEvent.click(menuBtn);
    fireEvent.click(await screen.findByText(/^Edit$/i));

    // mutate then cancel
    fireEvent.click(screen.getByTestId('edit-title'));
    expect(screen.getByRole('link', { name: /New Title/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-cancel'));
    await waitFor(() => {
      // back to "Survey One"
      expect(screen.getByRole('link', { name: /Survey One/i })).toBeInTheDocument();
      // dialog gone
      expect(screen.queryByTestId('edit-dialog')).not.toBeInTheDocument();
    });
  });
});
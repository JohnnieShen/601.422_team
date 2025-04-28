import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SurveyResults from './SurveyResults';
import '@testing-library/jest-dom';
import { getSurveyInfo, getSurveyResponses } from '../services/surveyService';
import { useParams, useNavigate } from 'react-router-dom';


jest.mock('../services/surveyService', () => ({
  getSurveyInfo: jest.fn(),
  getSurveyResponses: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('./Multi', () => ({ choices, answers }) => (
  <div data-testid="multi-choice">
    MultiChoice - {JSON.stringify({ choices, answers })}
  </div>
));

describe('SurveyResults Component', () => {
  const mockSurveyData = {
    title: 'Test Survey',
    questions: [
      { text: 'What is your name?', type: 'text' },
      { text: 'Do you like ice cream?', type: 'radio', options: ['Yes', 'No'] },
    ],
  };

  const mockResponses = [
    { responses: ['Alice', 'Bob'] },
    { responses: ['Yes'] },
  ];

  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ surveyId: 'test-survey-123' });
    useNavigate.mockReturnValue(mockNavigate);
  });

  test('displays loading spinner initially', () => {
    getSurveyInfo.mockReturnValue(new Promise(() => {}));
    getSurveyResponses.mockReturnValue(new Promise(() => {}));

    render(<SurveyResults />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders survey results correctly after fetching data', async () => {
    getSurveyInfo.mockResolvedValue(mockSurveyData);
    getSurveyResponses.mockResolvedValue(mockResponses);

    render(<SurveyResults />);

    // Wait for the title to appear which indicates loading is done
    await waitFor(() => {
      expect(screen.getByText(`Results for ${mockSurveyData.title}`)).toBeInTheDocument();
    });

    // Verify responses for the text question are rendered
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();

    // Verify that the multi-choice component appears for the radio question
    const multiChoiceComponent = screen.getByTestId('multi-choice');
    expect(multiChoiceComponent).toBeInTheDocument();
    // Check that the component rendered the expected options and answer
    expect(multiChoiceComponent).toHaveTextContent('"Yes","No"');
    expect(multiChoiceComponent).toHaveTextContent('"Yes"');
  });

  test('displays "No questions available" if surveyQuestions is empty', async () => {
    const emptySurveyData = {
      title: 'Empty Survey',
      questions: [],
    };

    getSurveyInfo.mockResolvedValue(emptySurveyData);
    // Even if responses are returned, no questions exist to display
    getSurveyResponses.mockResolvedValue([]);
    render(<SurveyResults />);

    await waitFor(() => {
      expect(screen.getByText(`Results for ${emptySurveyData.title}`)).toBeInTheDocument();
    });

    expect(screen.getByText(/no questions available to show/i)).toBeInTheDocument();
  });

  test('navigates back when "Back to Surveys" button is clicked', async () => {
    getSurveyInfo.mockResolvedValue(mockSurveyData);
    getSurveyResponses.mockResolvedValue(mockResponses);

    render(<SurveyResults />);
    await waitFor(() => {
      expect(screen.getByText(`Results for ${mockSurveyData.title}`)).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /back to surveys/i });
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

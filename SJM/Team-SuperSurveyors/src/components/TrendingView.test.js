import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TrendingView from './TrendingView';
import { useNavigate } from 'react-router-dom';
import { getTrendingSurveys } from '../services/surveyService';
import { ThemeProvider } from '@mui/material';
import { theme } from './Survey';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../services/surveyService', () => ({
  getTrendingSurveys: jest.fn(),
}));

describe('TrendingView Component', () => {
  const mockNavigate = jest.fn();
  const mockSurveys = [
    {
      id: '1',
      title: 'Popular Survey',
      tags: ['trending', 'feedback'],
      responseCount: 150
    },
    {
      id: '2',
      title: 'Second Survey',
      tags: ['product'],
      responseCount: 100
    }
  ];

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    jest.clearAllMocks();
  });

  test('shows loading spinner initially', async () => {
    getTrendingSurveys.mockImplementation(() => new Promise(() => {}));
    
    render(
      <ThemeProvider theme={theme}>
        <TrendingView />
      </ThemeProvider>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays no surveys message when empty', async () => {
    getTrendingSurveys.mockResolvedValue([]);
    
    render(
      <ThemeProvider theme={theme}>
        <TrendingView />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/no trending surveys available/i)).toBeInTheDocument();
    });
  });

  test('renders surveys correctly', async () => {
    getTrendingSurveys.mockResolvedValue(mockSurveys);
    
    render(
      <ThemeProvider theme={theme}>
        <TrendingView />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/top 1: popular survey/i)).toBeInTheDocument();
      expect(screen.getByText(/top 2: second survey/i)).toBeInTheDocument();
      expect(screen.getAllByText(/^trending$/i)).toHaveLength(1);
      expect(screen.getByText(/150 results/i)).toBeInTheDocument();
    });
  });

  test('applies correct background colors', async () => {
    getTrendingSurveys.mockResolvedValue([
      { id: '1', title: 'First', responseCount: 200 },
      { id: '2', title: 'Second', responseCount: 150 },
      { id: '3', title: 'Third', responseCount: 100 },
      { id: '4', title: 'Fourth', responseCount: 50 }
    ]);
    
    const { container } = render(
      <ThemeProvider theme={theme}>
        <TrendingView />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      const cards = container.querySelectorAll('.MuiCard-root');
      expect(cards[0]).toHaveStyle('background-color: #FFD700');
      expect(cards[1]).toHaveStyle('background-color: silver');
      expect(cards[2]).toHaveStyle('background-color: #E89C51');
      expect(cards[3]).toHaveStyle('background-color: #6f98bd');
    });
  });

  test('navigates to results on button click', async () => {
    getTrendingSurveys.mockResolvedValue(mockSurveys);
    
    render(
      <ThemeProvider theme={theme}>
        <TrendingView />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /view the.*results/i });
      fireEvent.click(buttons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/survey-results/1');
    });
  });

  test('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getTrendingSurveys.mockRejectedValue(new Error('API Error'));
    
    render(
      <ThemeProvider theme={theme}>
        <TrendingView />
      </ThemeProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/no trending surveys available/i)).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });
});
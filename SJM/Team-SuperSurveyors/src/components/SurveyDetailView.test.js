import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import SurveyDetailView from './SurveyDetailView';
import '@testing-library/jest-dom';

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('./Question/Question', () => ({ question }) => (
  <div data-testid="question">{JSON.stringify(question)}</div>
));

describe('SurveyDetailView Component', () => {
  const mockNavigate = jest.fn();
  const mockSurveyData = {
    id: 'test-survey-123',
    title: 'Customer Satisfaction Survey',
    tags: ['feedback', 'product'],
    images: ['https://example.com/image1.jpg'],
    videos: ['https://example.com/video1.mp4'],
    audios: ['https://example.com/audio1.mp3'],
    questions: [
      { id: 1, text: 'How satisfied are you?' },
      { id: 2, text: 'Would you recommend us?' }
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ surveyId: 'test-survey-123' });
    useNavigate.mockReturnValue(mockNavigate);
    console.error = jest.fn();
  });

  test('renders loading spinner initially', () => {
    getDoc.mockImplementation(() => new Promise(() => {}));
    render(<SurveyDetailView />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles survey not found error', async () => {
    getDoc.mockResolvedValue({ exists: () => false });
    render(<SurveyDetailView />);
    
    await waitFor(() => {
      expect(screen.getByText('Survey not found')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  test('handles fetch error', async () => {
    getDoc.mockRejectedValue(new Error('Database error'));
    render(<SurveyDetailView />);
    
    await waitFor(() => {
      expect(screen.getByText('Error fetching survey')).toBeInTheDocument();
    });
  });

  test('renders survey details correctly', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockSurveyData,
      id: mockSurveyData.id,
    });

    render(<SurveyDetailView />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(mockSurveyData.title)).toBeInTheDocument();
    });

    // Verify metadata
    expect(screen.getByText(mockSurveyData.tags[0])).toBeInTheDocument();
    expect(screen.getByText(mockSurveyData.tags[1])).toBeInTheDocument();

    // Verify media gallery
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockSurveyData.images.length);
    mockSurveyData.images.forEach((img, index) => {
      expect(images[index]).toHaveAttribute('src', img);
    });

    const videos = screen.getAllByRole('video');
    expect(videos).toHaveLength(mockSurveyData.videos.length);
    mockSurveyData.videos.forEach((video, index) => {
      const source = within(videos[index]).getByTestId('video-source');
      expect(source).toHaveAttribute('src', video);
    });

    const audios = screen.getAllByRole('audio');
    expect(audios).toHaveLength(mockSurveyData.audios.length);
    mockSurveyData.audios.forEach((audio, index) => {
      const source = within(audios[index]).getByTestId('audio-source');
      expect(source).toHaveAttribute('src', audio);
    });

    // Verify questions
    const questions = screen.getAllByTestId('question');
    expect(questions).toHaveLength(mockSurveyData.questions.length);
    mockSurveyData.questions.forEach((question, index) => {
      expect(questions[index]).toHaveTextContent(JSON.stringify(question));
    });
  });

  test('navigation buttons work correctly', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockSurveyData,
    });

    render(<SurveyDetailView />);
    await waitFor(() => screen.getByText(mockSurveyData.title));

    // Test header back button
    const backButton = screen.getByRole('button', { name: /back/i });
    backButton.click();
    expect(mockNavigate).toHaveBeenCalledWith(-1);

    // Test error state back button
    getDoc.mockResolvedValue({ exists: () => false });
    render(<SurveyDetailView />);
    await waitFor(() => screen.getByText(/survey not found/i));
    screen.getByRole('button', { name: /go back/i }).click();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('handles missing media gracefully', async () => {
    const minimalSurveyData = {
      ...mockSurveyData,
      images: undefined,
      videos: undefined,
      audios: undefined,
    };

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => minimalSurveyData,
    });

    render(<SurveyDetailView />);
    await waitFor(() => screen.getByText(minimalSurveyData.title));

    expect(screen.queryByText('Media Gallery')).not.toBeInTheDocument();
  });
});



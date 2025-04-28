import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CreateAndSharing, { shareSurvey } from './createAndSharing';

const mockSurveyId = 'survey-123';
const originalNavigator = navigator;
const mockClipboard = { writeText: jest.fn() };

describe('CreateAndSharing Component', () => {
  beforeAll(() => {
    delete window.location;
    window.location = {
      origin: 'http://localhost',
      pathname: '/dashboard',
    };

    Object.defineProperty(window, 'navigator', {
      value: {
        share: jest.fn(),
        clipboard: mockClipboard,
      },
      writable: true,
    });
  });

  afterAll(() => {
    window.navigator = originalNavigator;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders share button correctly', () => {
    render(<CreateAndSharing surveyId={mockSurveyId} />);
    expect(
      screen.getByRole('button', { name: /share survey/i })
    ).toBeInTheDocument();
  });

  test('calls shareSurvey with correct surveyId on button click', () => {
    const shareSpy = jest.spyOn({ shareSurvey }, 'shareSurvey');
    render(<CreateAndSharing surveyId={mockSurveyId} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(shareSpy).toHaveBeenCalledWith(mockSurveyId);
  });
});

describe('shareSurvey Function', () => {
  const originalNavigator = navigator;
  let logSpy, errorSpy;

  beforeAll(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    window.alert = jest.fn();

    delete window.location;
    window.location = {
      origin: 'http://localhost',
      pathname: '/dashboard',
    };
  });

  afterAll(() => {
    window.navigator = originalNavigator;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator },
      writable: true,
    });
  });

  describe('Web Share API available', () => {
    beforeEach(() => {
      window.navigator.share = jest.fn()
        .mockImplementation(() => Promise.resolve());
    });

    test('uses Web Share API', async () => {
      await shareSurvey(mockSurveyId);
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Survey Invitation',
        text: 'Please take this survey!',
        url: 'http://localhost/dashboard#/answer/survey-123'
      });
    });

    test('handles success', async () => {
      await shareSurvey(mockSurveyId);
      expect(logSpy).toHaveBeenCalledWith('Successful share');
    });

    test('handles errors', async () => {
      const error = new Error('Sharing failed');
      window.navigator.share.mockRejectedValueOnce(error);
      await shareSurvey(mockSurveyId);
      expect(logSpy).toHaveBeenCalledWith('Error sharing', error);
    });
  });

  describe('Web Share API unavailable', () => {
    beforeEach(() => {
      delete window.navigator.share;
      window.navigator.clipboard = {
        writeText: jest.fn().mockResolvedValue(undefined),
      };
    });

    test('uses clipboard fallback', async () => {
      await shareSurvey(mockSurveyId);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost/dashboard#/answer/survey-123'
      );
      expect(window.alert).toHaveBeenCalledWith('Link copied to clipboard!');
    });

    test('handles clipboard errors', async () => {
      const error = new Error('Clipboard error');
      window.navigator.clipboard.writeText.mockRejectedValueOnce(error);
      await shareSurvey(mockSurveyId);
      expect(errorSpy).toHaveBeenCalledWith('Could not copy text: ', error);
    });
  });
});
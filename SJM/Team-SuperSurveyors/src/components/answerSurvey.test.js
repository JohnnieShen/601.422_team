jest.mock('../firebase');
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../services/userService');
jest.mock('../services/surveyService');
jest.mock('./taggingService');
const taggingService = require('./taggingService');

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AnswerSurvey from './answerSurvey';
import { Routes, Route } from 'react-router-dom';

const firestore = require('firebase/firestore');
const surveyService = require('../services/surveyService');
const firebase = require('../firebase');
const firebaseAuth = require('firebase/auth');
const mockSurvey = {
  id: 'survey‑123',
  title: 'Unit‑Test Survey',
  questions: [
    { id: 'q1', text: 'Your favourite colour?', type: 'text' },
    { id: 'q2', text: 'Pick a letter', type: 'multiple-choice', options: ['A', 'B'] },
  ],
  images: ['cat.jpg'],
};

const mockCurrentUser = { uid: 'test-user' };
const mockAuth = { currentUser: mockCurrentUser };

// Set up Cloudinary mock
global.cloudinary = {
  createUploadWidget: jest.fn(() => ({ open: jest.fn(), close: jest.fn(), destroy: jest.fn() })),
};

describe('<AnswerSurvey />', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    firebase.auth = mockAuth;
    firebase.default = { auth: mockAuth };
    firebase.db = {};
    
    firebaseAuth.getAuth.mockReturnValue(mockAuth);
    
    surveyService.getRandomSurvey.mockResolvedValue(mockSurvey);
    surveyService.checkCurrency.mockResolvedValue(true);
    
    firestore.updateDoc.mockResolvedValue({});
    firestore.deleteDoc = jest.fn().mockResolvedValue({});
    firestore.runTransaction = jest.fn(async (_db, fn) => fn({
      get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
      update: jest.fn(),
    }));
    const fakeUserDoc = {
      exists: () => false,
      // provide the fields the component will read
      data: () => ({ answeredSurveys: [], coins: 0 }),
    };
    
    firestore.runTransaction = jest.fn(async (_db, fn) =>
      fn({
        // transaction.get returns a *Promise* of the fake snapshot
        get: jest.fn().mockResolvedValue(fakeUserDoc),
        // transaction.update can be any jest spy
        update: jest.fn(),
      })
    );
    taggingService.generateTagsForSurvey = jest.fn().mockResolvedValue(['tag1']);
    taggingService.updateUserTags = jest.fn().mockResolvedValue();
  });

  test('shows spinner, then renders survey', async () => {
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByText('Unit‑Test Survey')).toBeInTheDocument();
  });

  test('keeps the loading spinner visible when no surveys exist', async () => {
    surveyService.getRandomSurvey.mockResolvedValue(null);
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
  
    // After a short wait the spinner should *still* be there.
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  test('submits answers → updateDoc called', async () => {
    surveyService.getRandomSurvey.mockResolvedValue({
      id: 'txt‑only',
      title: 'Text‑Only Survey',
      images: [],
      questions: [{ id: 'q1', text: 'Colour?', type: 'text' }],
    });
  
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await screen.findByText('Text‑Only Survey');
  
    fireEvent.change(screen.getByPlaceholderText(/your answer/i), {
      target: { value: 'Blue' },
    });
    fireEvent.click(screen.getByText(/submit answers/i));
  
    await waitFor(() => expect(firestore.updateDoc).toHaveBeenCalled());
  });

  test('shows "no more surveys" when service returns none', async () => {
    surveyService.getRandomSurvey.mockResolvedValue(null);
    firestore.getDocs.mockResolvedValue({ empty: true });
    
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    
    await waitFor(() => {
      expect(screen.getByText(/no surveys available/i)).toBeInTheDocument();
    });
  });
  test('renders an image gallery when the survey includes images', async () => {
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
  
    // Wait for the survey to load
    await screen.findByText('Unit‑Test Survey');
  
    // The heading
    expect(screen.getByText(/image gallery/i)).toBeInTheDocument();
  
    // The image itself
    const img = screen.getByAltText('Survey Image 0');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'cat.jpg');
  });
  
  test('shows a validation error when not all questions are answered', async () => {
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await screen.findByText('Unit‑Test Survey');
  
    // Answer ONLY the first (text) question
    fireEvent.change(screen.getByPlaceholderText('Your answer'), {
      target: { value: 'Blue' },
    });
  
    // Submit with one unanswered question
    fireEvent.click(screen.getByText(/submit answers/i));
  
    // updateDoc should not fire
    expect(firestore.updateDoc).not.toHaveBeenCalled();
  
    // Error snackbar appears
    expect(
      await screen.findByText(/please complete all questions/i)
    ).toBeInTheDocument();
  });
  
  test('clicking "Not interested? Answer a different survey" fetches a new survey', async () => {
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await screen.findByText('Unit‑Test Survey');
  
    // Reset mock call count so we only measure calls triggered by the click
    surveyService.getRandomSurvey.mockClear();
  
    fireEvent.click(
      screen.getByRole('button', { name: /not interested\? answer a different survey/i })
    );
  
    // Wait for the new fetch to complete
    await waitFor(() => {
      expect(surveyService.getRandomSurvey).toHaveBeenCalled();
    });
  });
  test('after a valid submission the success screen is rendered', async () => {
    surveyService.getRandomSurvey.mockResolvedValue({
      ...mockSurvey,
      questions: [{ id: 'q1', text: 'Colour?', type: 'text' }], // single Q
    });
  
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await screen.findByText('Unit‑Test Survey');
  
    fireEvent.change(screen.getByPlaceholderText(/your answer/i), {
      target: { value: 'Blue' },
    });
    fireEvent.click(screen.getByText(/submit answers/i));
  
    expect(
      await screen.findByText(/your response has been submitted successfully/i)
    ).toBeInTheDocument();
  });
  
  test('shows a “min characters” error when a text answer is too short', async () => {
    surveyService.getRandomSurvey.mockResolvedValue({
      id: 'txt‑only‑min',
      title: 'Min‑Chars Survey',
      images: [],
      questions: [{ id: 'q1', text: 'Colour?', type: 'text' }],
    });
  
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await screen.findByText('Min‑Chars Survey');
  
    fireEvent.change(screen.getByPlaceholderText(/your answer/i), {
      target: { value: 'Re' },             // only 2 chars
    });
    fireEvent.click(screen.getByText(/submit answers/i));
  
    expect(
      await screen.findByText(/at least 3 characters/i)
    ).toBeInTheDocument();
  });
  
  test('clicking the skip button clears incomplete answers via deleteDoc', async () => {
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await screen.findByText('Unit‑Test Survey');
  
    firestore.deleteDoc.mockClear();
    firestore.runTransaction.mockClear();
  
    fireEvent.click(
      screen.getByRole('button', { name: /not interested\? answer a different survey/i })
    );
  
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalled();
      expect(firestore.runTransaction).toHaveBeenCalled();
    });
  });
  
  test('shows “already answered” alert when Firestore says so', async () => {
    const surveySnapshot = {
      exists: () => true,
      id: 'survey‑xyz',
      data: () => ({
        title: 'Prev‑Answered',
        questions: [{ id: 'q1', text: 'dummy?', type: 'text' }],
      }),
    };
    const userSnapshot = {
      exists: () => true,
      data: () => ({ answeredSurveys: ['survey‑xyz'] }),
    };
  
    firestore.getDoc = jest
      .fn()
      .mockResolvedValueOnce(surveySnapshot)
      .mockResolvedValueOnce(userSnapshot);
  
    render(
      <MemoryRouter initialEntries={['/survey‑xyz']}>
        <Routes>
          <Route path="/:surveyId" element={<AnswerSurvey />} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(
      await screen.findByText(/you have already answered this survey/i)
    ).toBeInTheDocument();
  });
  
  test('renders video and audio galleries when present', async () => {
    const surveySnap = {
      exists: () => true,
      id: 'media1',
      data: () => ({
        title: 'Media Survey',
        questions: [],
        videos: ['video.mp4'],
        audios: ['audio.mp3'],
      }),
    };
    const userSnap = { exists: () => true, data: () => ({ answeredSurveys: [] }) };
    firestore.getDoc
      .mockResolvedValueOnce(surveySnap)
      .mockResolvedValueOnce(userSnap);

    render(
      <MemoryRouter initialEntries={['/media1']}>
        <Routes>
          <Route path="/:surveyId" element={<AnswerSurvey />} />
        </Routes>
      </MemoryRouter>
    );

    // wait for title
    expect(await screen.findByText('Media Survey')).toBeInTheDocument();

    // video gallery
    expect(screen.getByText(/video gallery/i)).toBeInTheDocument();
    const vid = document.querySelector('video');
    expect(vid).toBeInTheDocument();
    expect(vid).toHaveAttribute('src', 'video.mp4');

    // audio gallery
    expect(screen.getByText(/audio gallery/i)).toBeInTheDocument();
    const aud = document.querySelector('audio');
    expect(aud).toBeInTheDocument();
    expect(aud).toHaveAttribute('src', 'audio.mp3');
  });
  
  test('fetchSurveyById shows the survey when user has not answered it', async () => {
    const surveySnap = {
      exists: () => true,
      id: 'special‑001',
      data: () => ({
        title: 'Special Survey',
        questions: [{ id: 'q1', text: 'Q?', type: 'text' }],
      }),
    };
    const userSnap = {
      exists: () => true,
      data: () => ({ answeredSurveys: [] }),
    };
  
    firestore.getDoc = jest
      .fn()
      .mockResolvedValueOnce(surveySnap)
      .mockResolvedValueOnce(userSnap);
  
    render(
      <MemoryRouter initialEntries={['/special‑001']}>
        <Routes>
          <Route path="/:surveyId" element={<AnswerSurvey />} />
        </Routes>
      </MemoryRouter>
    );
  
    expect(await screen.findByText('Special Survey')).toBeInTheDocument();
  });
  

  test('generateTagsForSurvey and updateUserTags are invoked on successful submit', async () => {
    const surveyService = require('../services/surveyService');
    surveyService.getRandomSurvey.mockResolvedValue({
      id: 'tag-test',
      title: 'Tag Test Survey',
      images: [],
      questions: [{ id: 'q1', text: 'First question?', type: 'text' }],
    });

    const firestore = require('firebase/firestore');
    firestore.updateDoc = jest.fn().mockResolvedValue({});
    firestore.runTransaction = jest.fn(async (_db, fn) => fn({
      get: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
      update: jest.fn(),
    }));
    firestore.deleteDoc = jest.fn().mockResolvedValue({});

    const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
    const { MemoryRouter } = require('react-router-dom');
    const React = require('react');
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);

    // Wait for the survey to appear
    expect(await screen.findByText('Tag Test Survey')).toBeInTheDocument();

    // Fill in the answer
    const input = screen.getByPlaceholderText(/your answer/i);
    fireEvent.change(input, { target: { value: 'Some answer' } });

    // Submit
    fireEvent.click(screen.getByText(/submit answers/i));

    // On submit, expect taggingService to be called correctly
    await waitFor(() => {
      expect(taggingService.generateTagsForSurvey).toHaveBeenCalledWith(
        'Tag Test Survey',
        ['First question?']
      );
      expect(taggingService.updateUserTags).toHaveBeenCalledWith(
        'test-user',
        'tag1'
      );
    });
  });
  test('loads and populates saved incomplete answers', async () => {
    // Mock fetching incompleteAnswers
    const incompleteSnap = {
      empty: false,
      docs: [{ data: () => ({ surveyId: 'incomplete‑id', answers: { '0': 'Saved answer' } }) }],
      forEach: function(cb) { this.docs.forEach(cb); }
    };
    firestore.getDocs = jest
      .fn()
      .mockResolvedValueOnce(incompleteSnap) // for fetchIncompleteSurvey
      .mockResolvedValueOnce({ empty: true }); // for fetchSurveyBasedOnTag

    // Mock survey fetch by ID
    const surveySnap = { exists: () => true, id: 'incomplete‑id', data: () => ({
      title: 'Incomplete Survey',
      questions: [{ type: 'text', text: 'Please save?' }]
    })};
    firestore.getDoc = jest
      .fn()
      .mockResolvedValueOnce(surveySnap);

    // No random surveys
    surveyService.getRandomSurvey.mockResolvedValue(null);

    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);

    // should show title and populate input with saved text
    expect(await screen.findByText('Incomplete Survey')).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/your answer/i);
    expect(input).toHaveValue('Saved answer');
  });

  test('shows error snackbar on submission failure', async () => {
    surveyService.getRandomSurvey.mockResolvedValue({
      id: 'fail‑survey',
      title: 'Failure Survey',
      images: [],
      questions: [{ id: 'q1', text: 'Why fail?', type: 'text' }],
    });
    // Make updateDoc throw
    firestore.updateDoc.mockRejectedValueOnce(new Error('update failed'));

    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);

    expect(await screen.findByText('Failure Survey')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/your answer/i), {
      target: { value: 'Testing' },
    });
    fireEvent.click(screen.getByText(/submit answers/i));

    expect(
      await screen.findByText('There was an error submitting your responses')
    ).toBeInTheDocument();
  });

  test('redirects to trending after showing already answered alert', async () => {
    jest.useFakeTimers();
    // Mock param surveyId path
    const surveySnap = { exists: () => true, id: 'ans‑id', data: () => ({
      title: 'Answered Survey',
      questions: [{ id: 'q1', text: 'Done?', type: 'text' }],
    })};
    const userSnap = { exists: () => true, data: () => ({ answeredSurveys: ['ans‑id'] }) };
    firestore.getDoc = jest
      .fn()
      .mockResolvedValueOnce(surveySnap)
      .mockResolvedValueOnce(userSnap);

    // Stub window.location
    delete window.location;
    window.location = { href: '' };

    render(
      <MemoryRouter initialEntries={['/ans‑id']}>
        <Routes>
          <Route path="/:surveyId" element={<AnswerSurvey />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/you have already answered this survey/i)
    ).toBeInTheDocument();

    // advance the timer by 3000ms
    jest.advanceTimersByTime(3000);
    expect(window.location.href).toContain('/#/trending');
    jest.useRealTimers();
  });
  test('clicking "Answer a new survey" after success triggers new fetch', async () => {
    // First survey to submit
    surveyService.getRandomSurvey
      .mockResolvedValueOnce({
        id: 'single',
        title: 'Single Q Survey',
        images: [],
        questions: [{ id: 'q1', text: 'Hello?', type: 'text' }],
      })
      // Next call for the new survey
      .mockResolvedValueOnce({
        id: 'next',
        title: 'Next Survey',
        images: [],
        questions: [{ id: 'q1', text: 'Next Q?', type: 'text' }],
      });
    
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    
    // Submit the first survey
    expect(await screen.findByText('Single Q Survey')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/your answer/i), {
      target: { value: 'Test answer' },
    });
    fireEvent.click(screen.getByText(/submit answers/i));
    
    // Wait for success screen
    expect(
      await screen.findByText(/your response has been submitted successfully/i)
    ).toBeInTheDocument();
    
    // Click "Answer a new survey"
    fireEvent.click(screen.getByRole('button', { name: /answer a new survey/i }));
    
    // The next survey should load
    expect(await screen.findByText('Next Survey')).toBeInTheDocument();
  });

    test('does not render any galleries when there is no media', async () => {
      surveyService.getRandomSurvey.mockResolvedValue({
        id: 'plain',
        title: 'Plain Survey',
        images: [],
        videos: [],
        audios: [],
        questions: [{ id: 'q1', text: 'Just text?', type: 'text' }],
      });
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
      expect(await screen.findByText('Plain Survey')).toBeInTheDocument();
  
      expect(screen.queryByText(/image gallery/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/video gallery/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/audio gallery/i)).not.toBeInTheDocument();
      expect(document.querySelector('img')).toBeNull();
      expect(document.querySelector('video')).toBeNull();
      expect(document.querySelector('audio')).toBeNull();
    });
  
    test('form-level refresh button ignores saved answers and fetches new survey', async () => {
      // Prepare an incompleteAnswers to ensure it would normally be loaded
      const incompleteSnap = {
        empty: false,
        docs: [{ data: () => ({ surveyId: 'should‑ignore', answers: { '0': 'old' } }) }],
        forEach: function(cb) { this.docs.forEach(cb); }
      };
      firestore.getDocs = jest
        .fn()
        .mockResolvedValueOnce({ empty: true })
        .mockResolvedValueOnce(incompleteSnap)
        .mockResolvedValueOnce({ empty: true });
  
      // First random survey, then next random survey
      surveyService.getRandomSurvey
        .mockResolvedValueOnce({
          id: 'first',
          title: 'First Survey',
          images: [],
          questions: [{ id: 'q1', text: 'Q?', type: 'text' }],
        })
        .mockResolvedValueOnce({
          id: 'second',
          title: 'Second Survey',
          images: [],
          questions: [{ id: 'q1', text: 'Again?', type: 'text' }],
        });
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
  
      // Should load "First Survey"
      expect(await screen.findByText('First Survey')).toBeInTheDocument();
  
      // Click the top "Not interested? Answer a different survey"
      fireEvent.click(screen.getByRole('button', { name: /not interested\? answer a different survey/i }));
  
      // Should ignore the incomplete and load "Second Survey"
      expect(await screen.findByText('Second Survey')).toBeInTheDocument();
    });

    test('submits and shows success for a survey with no questions', async () => {
      // Zero-question survey
      surveyService.getRandomSurvey.mockResolvedValue({
        id: 'noq',
        title: 'No Question Survey',
        images: [],
        questions: [],
      });
      firestore.updateDoc = jest.fn().mockResolvedValue({});
      firestore.runTransaction = jest.fn(async (_db, fn) => fn({
        get: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({ answeredSurveys: [], coins: 0 }) }),
        update: jest.fn(),
      }));
      firestore.deleteDoc = jest.fn().mockResolvedValue({});
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
      expect(await screen.findByText('No Question Survey')).toBeInTheDocument();
  
      // Click submit with no questions
      fireEvent.click(screen.getByText(/submit answers/i));
  
      // Should immediately go to success screen
      expect(
        await screen.findByText(/your response has been submitted successfully/i)
      ).toBeInTheDocument();
    });
  
    test('does not call updateUserTags when no tags are generated', async () => {
      surveyService.getRandomSurvey.mockResolvedValue({
        id: 'no‑tag',
        title: 'No Tag Survey',
        images: [],
        questions: [{ id: 'q1', text: 'Q?', type: 'text' }],
      });
      taggingService.generateTagsForSurvey.mockResolvedValue([]);  // no tags
      firestore.updateDoc = jest.fn().mockResolvedValue({});
      firestore.runTransaction = jest.fn(async (_db, fn) => fn({
        get: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({ answeredSurveys: [], coins: 0 }) }),
        update: jest.fn(),
      }));
      firestore.deleteDoc = jest.fn().mockResolvedValue({});
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
      expect(await screen.findByText('No Tag Survey')).toBeInTheDocument();
  
      fireEvent.change(screen.getByPlaceholderText(/your answer/i), {
        target: { value: 'Answer' },
      });
      fireEvent.click(screen.getByText(/submit answers/i));
  
      await waitFor(() => {
        expect(taggingService.generateTagsForSurvey).toHaveBeenCalledWith(
          'No Tag Survey',
          ['Q?']
        );
        expect(taggingService.updateUserTags).not.toHaveBeenCalled();
      });
    });
  
    test('fetchSurveyById renders image, video, and audio galleries', async () => {
      // Mock survey document with all media
      const surveySnap = {
        exists: () => true,
        id: 'media‑id',
        data: () => ({
          title: 'Full Media Survey',
          questions: [],
          images: ['img1.png'],
          videos: ['vid1.mp4'],
          audios: ['aud1.mp3'],
        }),
      };
      const userSnap = {
        exists: () => true,
        data: () => ({ answeredSurveys: [] }),
      };
      firestore.getDoc = jest
        .fn()
        .mockResolvedValueOnce(surveySnap)
        .mockResolvedValueOnce(userSnap);
  
      render(
        <MemoryRouter initialEntries={['/media‑id']}>
          <Routes>
            <Route path="/:surveyId" element={<AnswerSurvey />} />
          </Routes>
        </MemoryRouter>
      );
  
      // Wait for title
      expect(await screen.findByText('Full Media Survey')).toBeInTheDocument();
  
      // Check each gallery heading
      expect(screen.getByText(/image gallery/i)).toBeInTheDocument();
      expect(screen.getByText(/video gallery/i)).toBeInTheDocument();
      expect(screen.getByText(/audio gallery/i)).toBeInTheDocument();
  
      // Check media elements
      const img = screen.getByAltText('Survey Image 0');
      expect(img).toHaveAttribute('src', 'img1.png');
      const video = document.querySelector('video');
      expect(video).toHaveAttribute('src', 'vid1.mp4');
      const audio = document.querySelector('audio');
      expect(audio).toHaveAttribute('src', 'aud1.mp3');
    });
    test('fetchSurveyById logs error when survey not found', async () => {
      const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      // getDoc returns a snapshot with exists()===false
      firestore.getDoc = jest.fn().mockResolvedValue({ exists: () => false });
  
      render(
        <MemoryRouter initialEntries={['/not-there']}>
          <Routes>
            <Route path="/:surveyId" element={<AnswerSurvey />} />
          </Routes>
        </MemoryRouter>
      );
  
      // Wait for fetch to complete (spinner goes away)
      await waitFor(() => {
        // it should have logged our error
        expect(consoleErr).toHaveBeenCalledWith('Survey not found');
      });
      consoleErr.mockRestore();
    });
  
    test('fetchSurveyById logs error when getDoc throws', async () => {
      const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      // getDoc rejects
      firestore.getDoc = jest.fn().mockRejectedValue(new Error('boom'));
  
      render(
        <MemoryRouter initialEntries={['/bad-id']}>
          <Routes>
            <Route path="/:surveyId" element={<AnswerSurvey />} />
          </Routes>
        </MemoryRouter>
      );
  
      await waitFor(() => {
        expect(consoleErr).toHaveBeenCalledWith(
          'Error fetching survey:',
          expect.any(Error)
        );
      });
      consoleErr.mockRestore();
    });
  
    test('handles error saving incomplete answers gracefully', async () => {
      const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      // Make setDoc throw
      firestore.setDoc = jest.fn().mockRejectedValue(new Error('save failed'));
      // A simple survey
      surveyService.getRandomSurvey.mockResolvedValue({
        id: 'err-survey',
        title: 'Error Survey',
        images: [],
        questions: [{ type: 'text', text: 'Err?' }],
      });
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
      expect(await screen.findByText('Error Survey')).toBeInTheDocument();
  
      // Type to trigger saveIncompleteAnswers
      fireEvent.change(screen.getByPlaceholderText(/your answer/i), {
        target: { value: 'Oops' },
      });
  
      await waitFor(() => {
        expect(consoleErr).toHaveBeenCalledWith(
          'Error saving incomplete answers:',
          expect.any(Error)
        );
      });
      consoleErr.mockRestore();
    });
    test('logs error when fetching tagged surveys fails', async () => {
      const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      // First getDocs used in fetchSurveyBasedOnTag should reject
      firestore.getDocs = jest.fn().mockRejectedValue(new Error('tag-fetch-fail'));
  
      // Prevent random survey falling back
      surveyService.getRandomSurvey.mockResolvedValue(null);
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
  
      await waitFor(() => {
        expect(consoleErr).toHaveBeenCalledWith(
          'Error fetching tagged survey recommendation:',
          expect.any(Error)
        );
      });
      consoleErr.mockRestore();
    });
  
    test('logs error when fetching incomplete survey fails', async () => {
      const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
      // First getDocs in fetchIncompleteSurvey should reject
      firestore.getDocs = jest.fn().mockRejectedValue(new Error('incomplete-fetch-fail'));
      // Allow tag fetch to succeed but no surveys
      firestore.getDocs
        .mockRejectedValueOnce(new Error('incomplete-fetch-fail'))
        .mockResolvedValueOnce({ empty: true });
      surveyService.getRandomSurvey.mockResolvedValue(null);
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
  
      await waitFor(() => {
        expect(consoleErr).toHaveBeenCalledWith(
          'Error fetching incomplete survey:',
          expect.any(Error)
        );
      });
      consoleErr.mockRestore();
    });
  
    test('completeSurvey increments coins after successful submit', async () => {
      // Spy deleteDoc
      firestore.deleteDoc = jest.fn().mockResolvedValue({});
      // Capture updates
      const updates = [];
      firestore.runTransaction = jest.fn(async (_db, fn) => {
        const tx = {
          get: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ answeredSurveys: [], coins: 2 }) }),
          update: jest.fn((ref, data) => updates.push(data)),
        };
        await fn(tx);
      });
      surveyService.getRandomSurvey.mockResolvedValue({
        id: 'inc-survey',
        title: 'Inc Survey',
        images: [],
        questions: [{ id: 'q1', text: 'Q?', type: 'text' }],
      });
  
      render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
      expect(await screen.findByText('Inc Survey')).toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText(/your answer/i), { target: { value: 'Ans' } });
      fireEvent.click(screen.getByText(/submit answers/i));
  
      // Wait for completeSurvey to run
      await waitFor(() => expect(firestore.deleteDoc).toHaveBeenCalled());
      // coins should have been incremented to 3
      expect(updates).toContainEqual(expect.objectContaining({ coins: 3 }));
    });
  
    test('completeSurvey does not increment coins on skip', async () => {
      // Spy deleteDoc
      firestore.deleteDoc = jest.fn().mockResolvedValue({});
      const updates = [];
      firestore.runTransaction = jest.fn(async (_db, fn) => {
        const tx = {
          get: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ answeredSurveys: [], coins: 4 }) }),
          update: jest.fn((ref, data) => updates.push(data)),
        };
        await fn(tx);
      });
  
      // Mock fetchSurveyById path
      const surveySnap = {
        exists: () => true,
        id: 'skip-survey',
        data: () => ({ title: 'Skip Survey', questions: [{ id: 'q1', text: 'Q?', type: 'text' }] })
      };
      const userSnap = { exists: () => true, data: () => ({ answeredSurveys: [] }) };
      firestore.getDoc = jest.fn()
        .mockResolvedValueOnce(surveySnap)
        .mockResolvedValueOnce(userSnap);
  
      render(
        <MemoryRouter initialEntries={['/skip-survey']}>
          <Routes>
            <Route path="/:surveyId" element={<AnswerSurvey />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText('Skip Survey')).toBeInTheDocument();
  
      // Click the skip (“Not interested?”) button
      fireEvent.click(screen.getByRole('button', { name: /not interested\? answer a different survey/i }));
  
      await waitFor(() => {
        expect(firestore.deleteDoc).toHaveBeenCalled();
        expect(updates).toContainEqual(expect.objectContaining({ coins: 4 }));
      });
    });
});
describe('Error and edge-case coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default auth returns valid user
    const mockAuth = { currentUser: { uid: 'test-user' } };
    require('firebase/auth').getAuth.mockReturnValue(mockAuth);
    const firestore = require('firebase/firestore');
    firestore.updateDoc = jest.fn().mockResolvedValue({});
    const taggingService = require('./taggingService');
    taggingService.generateTagsForSurvey = jest.fn().mockResolvedValue([]);
    taggingService.updateUserTags = jest.fn().mockResolvedValue();
  });

  test('fetchIncompleteSurvey logs and returns null when user not logged in', async () => {
    require('firebase/auth').getAuth.mockReturnValue({ currentUser: null });
    const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    // getDocs should never be called because getUserId throws
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalledWith(
        'Error fetching incomplete survey:',
        expect.any(Error)
      );
    });
    consoleErr.mockRestore();
  });

  test('fetchIncompleteSurvey logs error when getDocs throws', async () => {
    const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const firestore = require('firebase/firestore');
    firestore.getDocs = jest.fn().mockRejectedValue(new Error('boom'));
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalledWith(
        'Error fetching incomplete survey:',
        expect.any(Error)
      );
    });
    consoleErr.mockRestore();
  });

  test('fetchSurveyBasedOnTag logs error when getDocs throws', async () => {
    const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const firestore = require('firebase/firestore');
    firestore.getDocs = jest.fn().mockRejectedValue(new Error('tag-error'));
    // ensure fallback doesn't mask
    require('../services/surveyService').getRandomSurvey.mockResolvedValue(null);
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalledWith(
        'Error fetching tagged survey recommendation:',
        expect.any(Error)
      );
    });
    consoleErr.mockRestore();
  });

  test('fetchSurveyById logs "Survey not found" when snapshot.exists() is false', async () => {
    const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const firestore = require('firebase/firestore');
    firestore.getDoc = jest.fn().mockResolvedValue({ exists: () => false });
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <Routes><Route path="/:surveyId" element={<AnswerSurvey />} /></Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalledWith('Survey not found');
    });
    consoleErr.mockRestore();
  });

  test('fetchSurveyById logs error when getDoc throws', async () => {
    const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const firestore = require('firebase/firestore');
    firestore.getDoc = jest.fn().mockRejectedValue(new Error('fetchById fail'));
    render(
      <MemoryRouter initialEntries={['/bad-id']}>
        <Routes><Route path="/:surveyId" element={<AnswerSurvey />} /></Routes>
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalledWith(
        'Error fetching survey:',
        expect.any(Error)
      );
    });
    consoleErr.mockRestore();
  });

  test('saveIncompleteAnswers logs error when setDoc throws', async () => {
    const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});
    const firestore = require('firebase/firestore');
    firestore.setDoc = jest.fn().mockRejectedValue(new Error('save-fail'));
    require('../services/surveyService').getRandomSurvey.mockResolvedValue({
      id: 'err-survey', title: 'Error Survey', questions: [{ type: 'text', text: 'Q?' }]
    });
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    expect(await screen.findByText('Error Survey')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/your answer/i), { target: { value: 'A' } });
    await waitFor(() => {
      expect(consoleErr).toHaveBeenCalledWith(
        'Error saving incomplete answers:',
        expect.any(Error)
      );
    });
    consoleErr.mockRestore();
  });

  test('completeSurvey increments coins on normal submit (skip=false)', async () => {
    const firestore = require('firebase/firestore');
    firestore.deleteDoc = jest.fn().mockResolvedValue();
    const updates = [];
    firestore.runTransaction = jest.fn(async (_db, fn) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ answeredSurveys: [], coins: 5 }) }),
        update: jest.fn((ref, data) => updates.push(data)),
      };
      await fn(tx);
    });
    require('../services/surveyService').getRandomSurvey.mockResolvedValue({
      id: 'inc-survey', title: 'Inc Survey', questions: [{ type: 'text', text: 'Q?' }]
    });
    render(<MemoryRouter><AnswerSurvey /></MemoryRouter>);
    expect(await screen.findByText('Inc Survey')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/your answer/i), { target: { value: 'Ans' } });
    fireEvent.click(screen.getByText(/submit answers/i));
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalled();
      expect(updates).toContainEqual(
        expect.objectContaining({ answeredSurveys: ['inc-survey'], coins: 6 })
      );
    });
  });

  test('completeSurvey does not increment coins on skip (skip=true)', async () => {
    const firestore = require('firebase/firestore');
    firestore.deleteDoc = jest.fn().mockResolvedValue();
    const updates = [];
    firestore.runTransaction = jest.fn(async (_db, fn) => {
      const tx = {
        get: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ answeredSurveys: [], coins: 7 }) }),
        update: jest.fn((ref, data) => updates.push(data)),
      };
      await fn(tx);
    });
    // simulate fetchSurveyById path with paramSurveyId
    const surveySnap = { exists: () => true, id: 'skip-survey', data: () => ({ title: 'Skip Survey', questions: [{ type: 'text', text: 'Q?' }] }) };
    const userSnap   = { exists: () => true, data: () => ({ answeredSurveys: [] }) };
    firestore.getDoc = jest.fn().mockResolvedValueOnce(surveySnap).mockResolvedValueOnce(userSnap);
    render(
      <MemoryRouter initialEntries={['/skip-survey']}>
        <Routes><Route path="/:surveyId" element={<AnswerSurvey />} /></Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText('Skip Survey')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /not interested\? answer a different survey/i }));
    await waitFor(() => {
      expect(firestore.deleteDoc).toHaveBeenCalled();
      expect(updates).toContainEqual(
        expect.objectContaining({ answeredSurveys: ['skip-survey'], coins: 7 })
      );
    });
  });
});

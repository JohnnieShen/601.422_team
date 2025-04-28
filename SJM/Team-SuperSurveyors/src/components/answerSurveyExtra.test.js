import { waitForElementToBeRemoved } from '@testing-library/react';

jest.mock('../firebase', () => ({
    __esModule: true,
    db:   {},
  }));
jest.mock('firebase/app', () => ({
    __esModule: true,
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
    getApp: jest.fn(),
  }));

jest.mock('firebase/firestore', () => ({
  __esModule: true,
  getFirestore:   jest.fn(() => ({})),
  collection:     jest.fn(),
  addDoc:         jest.fn(),
  getDocs:        jest.fn(),
  doc:            jest.fn(),
  getDoc:         jest.fn(),
  setDoc:         jest.fn(),
  deleteDoc:      jest.fn(),
  runTransaction: jest.fn(),
  where:          jest.fn(),
  documentId:     jest.fn(),
  query:          jest.fn((querySource, ...queryConstraints) => ({
    _querySource: querySource,
    _queryConstraints: queryConstraints,
    type: 'mockQuery'
})),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../services/surveyService', () => ({
  getRandomSurvey: jest.fn(),
}));

jest.mock('firebase/auth', () => {
    const mockCreate = jest.fn();
    const auth = { currentUser: { uid: 'test-user' } };
    return {
        __esModule: true,
        mockCreate,
        getAuth: jest.fn(() => auth), // Correctly mocks getAuth
        createUserWithEmailAndPassword: (...args) => mockCreate(...args),
        auth,
    };
});
const firebase = require('../firebase');
const firebaseAuth = require('firebase/auth');
const mockCurrentUser = { uid: 'test-user' };
const mockAuth = { currentUser: mockCurrentUser };
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import AnswerSurvey from './answerSurvey';



const createMockSnapshot = (docs) => ({
  docs: docs,
  empty: docs.length === 0,
  forEach: (callback) => docs.forEach(callback),
});

const createMockDocSnapshot = (id, data, exists = true) => ({
  id: id,
  exists: () => exists,
  data: () => data,
  ref: { id: id, path: `someCollection/${id}` }
});

const mockFirestore = require('firebase/firestore');
const mockSurveyService = require('../services/surveyService');
const { useParams, useNavigate } = require('react-router-dom');

const mockNavigate = jest.fn();
useNavigate.mockReturnValue(mockNavigate);

const mockTransactionUpdate = jest.fn();
const mockTransactionGet = jest.fn();

mockFirestore.runTransaction.mockImplementation(async (db, callback) => {
  const mockTx = {
    get: mockTransactionGet.mockResolvedValue(createMockDocSnapshot('default-tx-get', {}, false)),
    update: mockTransactionUpdate,
  };
  await callback(mockTx);
});

const renderWithRouter = (initialEntries = ['/']) => {
  const match = initialEntries[0]?.match(/^\/([^/])/);
  const params = match ? { surveyId: match[1] } : {};
  useParams.mockReturnValue(params);

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<AnswerSurvey />} />
        <Route path="/:surveyId" element={<AnswerSurvey />} />
      </Routes>
    </MemoryRouter>
  );
};

const mockSurvey = {
    id: 'survey-123',
    title: 'Unit-Test Survey',
    questions: [
        { id: 'q1', text: 'Favorite Color?', type: 'text', required: true },
        { id: 'q2', text: 'Option A or B?', type: 'radio', options: ['A', 'B'], required: true },
        { id: 'q3', text: 'Select multiple', type: 'checkbox', options: ['X', 'Y', 'Z'], required: true },
    ],
};
jest.setTimeout(10000);
async function waitForLoadingToFinish() {
    const spinner = screen.queryByRole('progressbar');
    if (spinner) {
      await waitForElementToBeRemoved(spinner, { timeout: 3000 });
    }
  }
// --- Test Suites ---
describe('AnswerSurvey Component Tests', () => {
    const userId = 'test-user';
    beforeEach(() => {
        jest.clearAllMocks();
        mockFirestore.getDocs.mockResolvedValue(createMockSnapshot([]));
        mockFirestore.setDoc.mockResolvedValue();
        mockFirestore.deleteDoc.mockResolvedValue();
        mockFirestore.runTransaction.mockImplementation(async (db, callback) => {
           mockTransactionGet.mockResolvedValue(createMockDocSnapshot(userId, { answeredSurveys: [], coins: 5 }, true));
           const mockTx = { get: mockTransactionGet, update: mockTransactionUpdate };
           await callback(mockTx);
        });
        mockSurveyService.getRandomSurvey.mockResolvedValue(null);
        // mockAuth = { currentUser: "test-user" };
        firebase.auth = mockAuth;
        firebase.default = { auth: mockAuth };
        firebaseAuth.getAuth.mockReturnValue(mockAuth);
    });

    test('should render something initially', () => {
      renderWithRouter();
    });

    describe('fetchSurveyBasedOnTag Logic', () => {
        test('populates PQ based on user/survey tags and filters answered/owned', async () => {
            // Arrange
            const userSnap = createMockSnapshot([ createMockDocSnapshot(userId, { surveys: ['s-owned'], tags: ['T1', 'T3'], answeredSurveys: ['s-answered'] }) ]);
            const surveysSnap = createMockSnapshot([
                createMockDocSnapshot('s-owned', { title: 'Owned Survey', tags: ['T1'], questions: [] }),
                createMockDocSnapshot('s-answered', { title: 'Answered Survey', tags: ['T3'], questions: [] }),
                createMockDocSnapshot('s-match1', { title: 'Match T1 Survey', tags: ['T1'], questions: [{ id: 'q', text: 'Q?'}] }),
                createMockDocSnapshot('s-match3', { title: 'Match T3 Survey', tags: ['T3'], questions: [] }),
                createMockDocSnapshot('s-nomatch', { title: 'No Match Survey', tags: ['T2'], questions: [] }),
                createMockDocSnapshot('s-match13', { title: 'Match T1T3 Survey', tags: ['T1', 'T3'], questions: [{ id: 'q', text: 'Q?'}] })
            ]);
            mockFirestore.getDocs
                .mockResolvedValueOnce(userSnap)
                .mockResolvedValueOnce(surveysSnap)
                .mockResolvedValueOnce(createMockSnapshot([]));

            renderWithRouter();

            // Act: Wait for loading to finish
            await waitForElementToBeRemoved(() => screen.queryByRole('progressbar'));

            // Assert
            expect(screen.getByRole('heading', { level: 4, name: /No Match Survey/ })).toBeInTheDocument();
            expect(screen.queryByRole('heading', { name: /Owned Survey/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('heading', { name: /Answered Survey/i })).not.toBeInTheDocument();
            expect(mockSurveyService.getRandomSurvey).not.toHaveBeenCalled();
        });
          

        test('handles user with no tags/surveys gracefully', async () => {
            const userSnap = createMockSnapshot([
                createMockDocSnapshot(userId, { surveys: [], tags: null, answeredSurveys: null })
            ]);
            const surveysSnap = createMockSnapshot([
                createMockDocSnapshot('s-any1', { title: 'Any Survey 1', tags: ['T1'], questions: [{ id: 'q', type: 'text', text: 'Q?' }] }), // Score 0
                createMockDocSnapshot('s-any2', { title: 'Any Survey 2', tags: ['T2'], questions: [] }), // Score 0
            ]);
            mockFirestore.getDocs
                .mockResolvedValueOnce(userSnap)
                .mockResolvedValueOnce(surveysSnap)
                .mockResolvedValueOnce(createMockSnapshot([]));

            mockSurveyService.getRandomSurvey.mockResolvedValue(null);

            renderWithRouter();
            
            
            expect(
                await screen.findByRole('heading', { level: 4, name: /Any Survey [12]/ })
              ).toBeInTheDocument();
              expect(mockSurveyService.getRandomSurvey).not.toHaveBeenCalled();
        });
    }); // End describe fetchSurveyBasedOnTag Logic

    describe('fetchSurveys Logic', () => {
         beforeEach(() => {
             mockFirestore.getDocs.mockReset();
             mockSurveyService.getRandomSurvey.mockReset();
             mockFirestore.runTransaction.mockClear(); // Clear calls, keep default implementation
             mockTransactionUpdate.mockClear();
         });

        test('calls getRandomSurvey when priority queue is empty', async () => {
            const userSnap = createMockSnapshot([createMockDocSnapshot(userId, { surveys: [], tags: [], answeredSurveys: [] })]);
            const surveysSnap = createMockSnapshot([]); // No available surveys found
            mockFirestore.getDocs
                .mockResolvedValueOnce(userSnap)
                .mockResolvedValueOnce(surveysSnap)
                .mockResolvedValueOnce(createMockSnapshot([]));

            mockSurveyService.getRandomSurvey.mockResolvedValue({ id: 'random-s', title: 'Random Survey Loaded', questions: [] });

            renderWithRouter();
            
            expect(
                await screen.findByRole('heading', { level: 4, name: /Random Survey Loaded/ })
              ).toBeInTheDocument();
              expect(mockSurveyService.getRandomSurvey).toHaveBeenCalledTimes(1);
        });

    });

    describe('State Management', () => {
         beforeEach(() => {
             // Setup mocks for initial load of mockSurvey
             const userSnap = createMockSnapshot([createMockDocSnapshot(userId, { surveys: [], tags: [], answeredSurveys: [] })]);
             const surveysSnap = createMockSnapshot([createMockDocSnapshot(mockSurvey.id, mockSurvey)]);
             mockFirestore.getDocs
                .mockResolvedValueOnce(userSnap)
                .mockResolvedValueOnce(surveysSnap)
                .mockResolvedValueOnce(createMockSnapshot([]));
             mockSurveyService.getRandomSurvey.mockResolvedValue(null);
         });

        test('resets answers state when fetching a new survey (e.g., on skip)', async () => {
            renderWithRouter([`/${mockSurvey.id}`]);
            
            expect(
                await screen.findByRole('heading', { level: 4, name: /Unit-Test Survey/ })
              ).toBeInTheDocument();
        
              // Input something
              const textInput = screen.getByPlaceholderText('Your answer');
              fireEvent.change(textInput, { target: { value: 'Initial Answer' } });
              expect(textInput).toHaveValue('Initial Answer');
        
              // Prepare skip
              mockFirestore.runTransaction.mockImplementationOnce(async (db, callback) => {
                mockTransactionGet.mockResolvedValueOnce(
                  createMockDocSnapshot(userId, { answeredSurveys: [mockSurvey.id], coins: 5 }, true)
                );
                const mockTx = { get: mockTransactionGet, update: mockTransactionUpdate };
                await callback(mockTx);
              });
              mockFirestore.deleteDoc.mockResolvedValue();
              mockSurveyService.getRandomSurvey.mockResolvedValueOnce({
                id: 'next-s',
                title: 'Next Random Survey',
                questions: [{ id: 'nq1', text: 'Next Q?', type: 'text' }],
              });
        
              // Act: skip
              fireEvent.click(
                screen.getByRole('button', { name: /not interested\? answer a different survey/i })
              );
        
              // Assert new survey loads and input resets
              expect(
                await screen.findByRole('heading', { level: 4, name: /Next Random Survey/ })
              ).toBeInTheDocument();
              const nextTextInput = screen.getByPlaceholderText('Your answer');
              expect(nextTextInput).toHaveValue('');
            });
    });
});

describe('Additional coverage', () => {
  const userId = 'test-user';   // matches auth mock
    beforeEach(() => {
      firebaseAuth.getAuth.mockReturnValue(mockAuth);
      // the two below aren’t strictly required for this error but keep parity
      firebase.auth   = mockAuth;
      firebase.default = { auth: mockAuth };
      mockFirestore.getDoc.mockReset();
    });
  test('fetchSurveys dequeues from priority queue when it is NOT empty', async () => {
    // User owns nothing and hasn’t answered anything, but has tag T1
    const userSnap = createMockSnapshot([
      createMockDocSnapshot(userId, { surveys: [], tags: ['T1'], answeredSurveys: [] })
    ]);

    // Two surveys exist; one matches the user’s tag and should get score 1
    const surveysSnap = createMockSnapshot([
      createMockDocSnapshot('s-match', { title: 'PQ Survey', tags: ['T1'], questions: [{ id:'q', text:'Q?'}] }),
      createMockDocSnapshot('s-other', { title: 'Other',   tags: [],    questions: [] })
    ]);

    mockFirestore.getDocs
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(surveysSnap)
      .mockResolvedValueOnce(createMockSnapshot([]));

    mockSurveyService.getRandomSurvey.mockResolvedValue(null);

    renderWithRouter();

    expect(
      await screen.findByRole('heading', { level: 4, name: /other/i })
    ).toBeInTheDocument();
    expect(mockSurveyService.getRandomSurvey).not.toHaveBeenCalled();
  });

  test('handleAnswerChange normalises checkbox array values and saves them', async () => {
    const surveyId = 'array-survey';
  
    const userSnap = createMockSnapshot([
      createMockDocSnapshot(userId, { surveys: [], tags: [], answeredSurveys: [] })
    ]);
    const surveySnap = createMockSnapshot([
      createMockDocSnapshot(surveyId, {
        title: 'Array Survey',
        questions: [
          { id: 'q0', text: 'Pick', type: 'checkbox', options: ['A', 'B', 'C'] }
        ]
      })
    ]);
  
    mockFirestore.getDocs
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(surveySnap)
      .mockResolvedValueOnce(createMockSnapshot([]));
  
    mockFirestore.getDoc
      .mockResolvedValueOnce(
        createMockDocSnapshot(surveyId, {
          title: 'Array Survey',
          questions: [
            { id: 'q0', text: 'Pick', type: 'checkbox', options: ['A', 'B', 'C'] }
          ]
        }, true)
      )
      .mockResolvedValueOnce(
        createMockDocSnapshot(userId, { answeredSurveys: [], coins: 5 }, true)
      );
  
    mockSurveyService.getRandomSurvey.mockResolvedValue(null);
    mockFirestore.setDoc.mockClear();
  
    renderWithRouter([`/${surveyId}`]);
  
    await screen.findByText(/array survey/i);
    fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'C' }));
  
    await waitFor(() => expect(mockFirestore.setDoc).toHaveBeenCalledTimes(2));
    const saved = mockFirestore.setDoc.mock.calls.at(-1)[1];
    expect(saved.answers['0']).toEqual(['A', 'C']);
  });

  test('submission concatenates a single (string) answer onto existing responses', async () => {
    const surveyId = 'concat-survey';
  
    const userSnap = createMockSnapshot([
      createMockDocSnapshot(userId, { surveys: [], tags: [], answeredSurveys: [] })
    ]);
    const surveySnap = createMockSnapshot([
      createMockDocSnapshot(surveyId, {
        title: 'Concat Survey',
        questions: [{ id: 'q0', text: 'Colour?', type: 'text' }]
      })
    ]);
  
    mockFirestore.getDocs
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(surveySnap)
      .mockResolvedValueOnce(createMockSnapshot([]));
  
    mockFirestore.getDoc
      .mockResolvedValueOnce(
        createMockDocSnapshot(surveyId, {
          title: 'Concat Survey',
          questions: [{ id: 'q0', text: 'Colour?', type: 'text' }]
        }, true)
      )
      .mockResolvedValueOnce(
        createMockDocSnapshot(userId, { answeredSurveys: [], coins: 5 }, true)
      );
  
    mockSurveyService.getRandomSurvey.mockResolvedValue(null);
  
    mockFirestore.runTransaction.mockImplementationOnce(async (_db, cb) => {
      mockTransactionGet.mockImplementation(async (docRef) => {
        if (docRef.path.includes('/questions/0')) {
          return createMockDocSnapshot('q0', { responses: ['Red'] }, true);
        }
        return createMockDocSnapshot(userId, { answeredSurveys: [], coins: 5 }, true);
      });
      const tx = { get: mockTransactionGet, update: mockTransactionUpdate };
      await cb(tx);
    });
  
    renderWithRouter([`/${surveyId}`]);
  
    fireEvent.change(await screen.findByPlaceholderText(/your answer/i),
      { target: { value: 'Blue' } });
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));
  
    await waitFor(() =>
      expect(mockTransactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining('/questions/0') }),
        { responses: ['Red', 'Blue'] }       // ✔ concatenated
      )
    );
  });

  test('"Go back to your surveys" button navigates to /view', async () => {
    const surveyId = 'nav-survey';
  
    const userSnap = createMockSnapshot([
      createMockDocSnapshot(userId, { surveys: [], tags: [], answeredSurveys: [] })
    ]);
    const surveySnap = createMockSnapshot([
      createMockDocSnapshot(surveyId, {
        title: 'Nav Survey',
        questions: [{ id: 'q0', text: '?', type: 'text' }]
      })
    ]);
  
    mockFirestore.getDocs
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(surveySnap)
      .mockResolvedValueOnce(createMockSnapshot([]));
  
    mockFirestore.getDoc
      .mockResolvedValueOnce(
        createMockDocSnapshot(surveyId, {
          title: 'Nav Survey',
          questions: [{ id: 'q0', text: '?', type: 'text' }]
        }, true)
      )
      .mockResolvedValueOnce(
        createMockDocSnapshot(userId, { answeredSurveys: [], coins: 5 }, true)
      );
  
    mockSurveyService.getRandomSurvey.mockResolvedValue(null);
  
    mockFirestore.runTransaction.mockImplementation(async (_db, cb) => {
      mockTransactionGet.mockResolvedValue(
        createMockDocSnapshot(userId, { answeredSurveys: [], coins: 5 }, true));
      const tx = { get: mockTransactionGet, update: mockTransactionUpdate };
      await cb(tx);
    });
  
    renderWithRouter([`/${surveyId}`]);
  
    fireEvent.change(await screen.findByPlaceholderText(/your answer/i),
      { target: { value: 'ok' } });
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));
  
    await screen.findByText(/submitted successfully/i);
    fireEvent.click(screen.getByRole('button', { name: /go back to your surveys/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/view');
  });

  test('Snackbar close handler hides the alert', async () => {
    const surveyId = 'snack-survey';
  
    const userSnap = createMockSnapshot([
      createMockDocSnapshot(userId, { surveys: [], tags: [], answeredSurveys: [] })
    ]);
    const surveySnap = createMockSnapshot([
      createMockDocSnapshot(surveyId, {
        title: 'Snack Survey',
        questions: [{ id: 'q0', text: '?', type: 'text' }]
      })
    ]);
  
    mockFirestore.getDocs
      .mockResolvedValueOnce(userSnap)
      .mockResolvedValueOnce(surveySnap)
      .mockResolvedValueOnce(createMockSnapshot([]));
  
    // 🔑  getDoc stubs
    mockFirestore.getDoc
      .mockResolvedValueOnce(
        createMockDocSnapshot(surveyId, {
          title: 'Snack Survey',
          questions: [{ id: 'q0', text: '?', type: 'text' }]
        }, true)
      )
      .mockResolvedValueOnce(
        createMockDocSnapshot(userId, { answeredSurveys: [], coins: 5 }, true)
      );
  
    mockSurveyService.getRandomSurvey.mockResolvedValue(null);
    mockFirestore.runTransaction.mockRejectedValueOnce(new Error('fail'));
  
    renderWithRouter([`/${surveyId}`]);
  
    fireEvent.change(await screen.findByPlaceholderText(/your answer/i),
      { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /submit answers/i }));
  
    const alert = await screen.findByRole('alert');
    fireEvent.click(within(alert).getByRole('button', { name: /close/i }));
  
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
  });
});

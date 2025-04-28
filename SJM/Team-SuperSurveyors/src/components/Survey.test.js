import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import SurveyForm, { theme } from './Survey';
import '@testing-library/jest-dom';
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
} from 'firebase/firestore';
import { addSurveyToUser } from '../services/userService';
import { checkCurrency, updateCurrency } from '../services/surveyService';
import { useNavigate } from 'react-router-dom';

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../services/userService', () => ({
  addSurveyToUser: jest.fn(),
}));
jest.mock('../services/surveyService', () => ({
  checkCurrency: jest.fn(),
  updateCurrency: jest.fn(),
}));

jest.mock('../services/uploadService', () => ({
  UploadWidget: ({ onUpload }) => (
    <div data-testid="upload-widget">
      <button onClick={() => onUpload('https://example.com/image.jpg', 'image')}>
        Upload Image
      </button>
      <button onClick={() => onUpload('https://example.com/video.mp4', 'video')}>
        Upload Video
      </button>
      <button onClick={() => onUpload('https://example.com/audio.mp3', 'audio')}>
        Upload Audio
      </button>
    </div>
  ),
}));

jest.mock('./Question/Question', () => ({ question }) => (
  <div data-testid="question">{JSON.stringify(question)}</div>
));

describe('SurveyForm Component', () => {
  const mockNavigate = jest.fn();
  let consoleErrorSpy;
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    getDocs.mockResolvedValue({
      docs: [{ id: 'Tag1' }, { id: 'Tag2' }],
    });
    useNavigate.mockReturnValue(mockNavigate);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
  });
  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });
  const mount = () => render(<SurveyForm />);

  const renderComponent = () =>
    render(
      <SurveyForm />
    );

  test('renders initial SurveyForm components', async () => {
    renderComponent();

    expect(
      screen.getByRole('heading', { name: /create a survey/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter survey title/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter your question/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('upload-widget')).toBeInTheDocument();
  });

  test('fetches and displays tags in the select menu', async () => {
    renderComponent();
    await waitFor(() => expect(getDocs).toHaveBeenCalled());

    const combos = screen.getAllByRole('combobox');
    const tagSelect = combos[1];
    fireEvent.mouseDown(tagSelect);

    expect(await screen.findByText('Tag1')).toBeInTheDocument();
    expect(await screen.findByText('Tag2')).toBeInTheDocument();
  });

  test('adds an option for radio/checkbox question', async () => {
    renderComponent();

    const [responseTypeSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(responseTypeSelect);
    fireEvent.click(await screen.findByText(/single select/i));

    const optionInput = screen.getByLabelText(/option/i);
    fireEvent.change(optionInput, { target: { value: 'Option A' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  test('shows error when trying to add an invalid question', async () => {
    renderComponent();
    const addQuestionButton = screen.getByRole('button', { name: /add question/i });
    const questionInput = screen.getByPlaceholderText(/enter your question/i);

    fireEvent.change(questionInput, { target: { value: 'Hi' } });
    fireEvent.click(addQuestionButton);
    expect(
      await screen.findByText(/at least 5 characters/i)
    ).toBeInTheDocument();

    fireEvent.change(questionInput, { target: { value: 'Valid Question?' } });
    const [responseTypeSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(responseTypeSelect);
    fireEvent.click(await screen.findByText(/single select/i));
    fireEvent.click(addQuestionButton);
    expect(
      await screen.findByText(/at least one option/i)
    ).toBeInTheDocument();
  });

  test('adds a valid question and then removes it', async () => {
    renderComponent();

    const questionInput = screen.getByPlaceholderText(/enter your question/i);
    fireEvent.change(questionInput, { target: { value: 'How are you feeling today?' } });
    const addQuestionButton = screen.getByRole('button', { name: /add question/i });
    fireEvent.click(addQuestionButton);

    const addedQuestion = await screen.findByTestId('question');
    expect(addedQuestion).toHaveTextContent(/how are you feeling today\?/i);

    const removeButton = screen.getByRole('button', { name: /remove question/i });
    fireEvent.click(removeButton);
    await waitFor(() => {
      expect(screen.queryByTestId('question')).not.toBeInTheDocument();
    });
  });

  test('toggles the sharePublicly checkbox', async () => {
    renderComponent();

    const checkbox = screen.getByRole('checkbox', {
      name: /allow this survey to appear in the trending surveys page/i,
    });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  test('upload widget adds media', async () => {
    checkCurrency.mockResolvedValue(true);
    addDoc.mockResolvedValue({ id: 'newSurveyId' });
    setDoc.mockResolvedValue();
    renderComponent();

    const widget = screen.getByTestId('upload-widget');
    fireEvent.click(within(widget).getByText(/upload image/i));
    fireEvent.click(within(widget).getByText(/upload video/i));
    fireEvent.click(within(widget).getByText(/upload audio/i));

    fireEvent.change(
      screen.getByPlaceholderText(/enter survey title/i),
      { target: { value: 'Valid Survey Title' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/enter your question/i),
      { target: { value: 'What is your opinion?' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));

    const submitButton = screen.getByRole('button', { name: /submit survey/i });
    fireEvent.click(submitButton);
  });

  test('shows error if there is an unfinished question on submit', async () => {
    renderComponent();
    fireEvent.change(
      screen.getByPlaceholderText(/enter survey title/i),
      { target: { value: 'Valid Survey Title' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/enter your question/i),
      { target: { value: 'Unfinished question' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /submit survey/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      /please include at least 1 question in your survey/i
    );
  });

  test('shows error if survey title is too short on submit', async () => {
    checkCurrency.mockResolvedValue(true);
    renderComponent();

    const titleInput = screen.getByPlaceholderText(/enter survey title/i);
    fireEvent.change(titleInput, { target: { value: 'Hey' } });
    const questionInput = screen.getByPlaceholderText(/enter your question/i);
    fireEvent.change(questionInput, { target: { value: 'What do you think about our service?' } });
    const addQuestionButton = screen.getByRole('button', { name: /add question/i });
    fireEvent.click(addQuestionButton);

    const submitButton = screen.getByRole('button', { name: /submit survey/i });
    fireEvent.click(submitButton);
    expect(
      await screen.findByText(/please include a descriptive title for your survey \(at least 5 characters\)/i)
    ).toBeInTheDocument();
  });
  test('resets options when changing response type', async () => {
    renderComponent();
    const [responseTypeSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(responseTypeSelect);
    fireEvent.click(await screen.findByText(/single select/i));

    const optionInput = screen.getByLabelText(/option/i);
    fireEvent.change(optionInput, { target: { value: 'Opt1' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByText('Opt1')).toBeInTheDocument();

    fireEvent.mouseDown(responseTypeSelect);
    fireEvent.click(await screen.findByText(/multiple select/i));
    expect(screen.queryByText('Opt1')).toBeNull();
    expect(screen.getByLabelText(/option/i)).toBeInTheDocument();
  });

  test('removes an option when clicking its delete icon', async () => {
    renderComponent();
    const [responseTypeSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(responseTypeSelect);
    fireEvent.click(await screen.findByText(/single select/i));

    const optionInput = screen.getByLabelText(/option/i);
    fireEvent.change(optionInput, { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    fireEvent.change(optionInput, { target: { value: 'B' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    let items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);

    fireEvent.click(within(items[0]).getByRole('button'));
    items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(screen.queryByText('A')).toBeNull();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  test('closes question‑failure Snackbar when its close icon is clicked', async () => {
    renderComponent();
    fireEvent.change(
      screen.getByPlaceholderText(/enter your question/i),
      { target: { value: 'Hi' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    const alert = await screen.findByRole('alert');
    fireEvent.click(within(alert).getByRole('button'));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  test('closes survey‑failure Snackbar when its close icon is clicked', async () => {
    renderComponent();
    fireEvent.change(
      screen.getByPlaceholderText(/enter survey title/i),
      { target: { value: 'Valid Survey' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/enter your question/i),
      { target: { value: 'Unfinished?' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /submit survey/i }));
    const alert = await screen.findByRole('alert');
    fireEvent.click(within(alert).getByRole('button'));
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  test('removes a selected tag chip when its delete icon is clicked', async () => {
      renderComponent();
      await waitFor(() => expect(getDocs).toHaveBeenCalled());

      const combos = screen.getAllByRole('combobox');
      const tagSelect = combos[1];

      fireEvent.mouseDown(tagSelect);
      fireEvent.click(await screen.findByText('Tag1'));
      const chip1Label = await screen.findByText('Tag1', { selector: '.MuiChip-label' });

      fireEvent.mouseDown(tagSelect);
      fireEvent.click(await screen.findByText('Tag2'));
      const chip2Label = await screen.findByText('Tag2', { selector: '.MuiChip-label' });

      expect(chip1Label).toBeInTheDocument();
      expect(chip2Label).toBeInTheDocument();

      const chip1Root = chip1Label.closest('.MuiChip-root');
      expect(chip1Root).toBeInTheDocument();

      const deleteIcon1 = within(chip1Root).getByTestId('CancelIcon');

      fireEvent.click(deleteIcon1);

      await waitFor(() => {
        expect(screen.queryByText('Tag1', { selector: '.MuiChip-label' })).not.toBeInTheDocument();
      });
      expect(screen.getByText('Tag2', { selector: '.MuiChip-label' })).toBeInTheDocument();
  });
  test('logs an error if fetching tags fails', async () => {
    const fetchError = new Error('Firestore fetch failed');
    getDocs.mockRejectedValue(fetchError);

    renderComponent();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching tags:',
        fetchError
      );
    });
  });

  test('shows "Insufficient coins" error on submit if checkCurrency returns false', async () => {
    checkCurrency.mockResolvedValue(false);

    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/enter survey title/i), {
      target: { value: 'A Valid Title' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your question/i), {
      target: { value: 'A Valid Question?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    await screen.findByTestId('question');

    fireEvent.click(screen.getByRole('button', { name: /submit survey/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      /insufficient coins\. please answer other surveys first\./i
    );
  });

  test('shows "unfinished question" error on submit if question input is not cleared after adding a question', async () => {
    checkCurrency.mockResolvedValue(true);

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/enter survey title/i), {
      target: { value: 'Another Valid Title' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your question/i), {
      target: { value: 'First Question Done?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));
    await screen.findByTestId('question');

    fireEvent.change(screen.getByPlaceholderText(/enter your question/i), {
      target: { value: 'Still typing...' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit survey/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      /please add your unfinished question to your survey or clear out the inputs/i
    );
  });
  it('auto-closes the *question*-failure Snackbar after 4 s', async () => {
    mount();

    fireEvent.change(
      screen.getByPlaceholderText(/enter your question/i),
      { target: { value: 'Hi' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /add question/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/at least 5 characters/i);

    act(() => { jest.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('auto-closes the *survey*-failure Snackbar after 4 s', async () => {
    jest.useFakeTimers();
    checkCurrency.mockResolvedValue(true);
    renderComponent();
    fireEvent.change(
      screen.getByPlaceholderText(/enter survey title/i),
      { target: { value: 'A valid title' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /submit survey/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/at least 1 question/i);

    act(() => { jest.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditableQuestion from './EditableQuestion';
import Question from './Question';

// helper to build a question object
const buildQuestion = (overrides = {}) => ({
  id: 'q1',
  text: 'What is your name?',
  type: 'text',
  options: [],
  ...overrides,
});

describe('<EditableQuestion>', () => {
  const baseQuestion = buildQuestion();
  let onAnswerChange, onTitleChange, onOptionChange, onTypeChange;

  beforeEach(() => {
    onAnswerChange = jest.fn();
    onTitleChange  = jest.fn();
    onOptionChange = jest.fn();
    onTypeChange   = jest.fn();
  });

  const renderEditable = (props = {}) =>
    render(
      <EditableQuestion
        id={baseQuestion.id}
        question={baseQuestion}
        onAnswerChange={onAnswerChange}
        onTitleChange={onTitleChange}
        onOptionChange={onOptionChange}
        onTypeChange={onTypeChange}
        {...props}
      />
    );

  test('shows title + edit icon by default', () => {
    renderEditable();
    expect(screen.getByText(baseQuestion.text)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('click pencil → input → edit → blur calls onTitleChange', async () => {
    renderEditable();
    await userEvent.click(screen.getByRole('button'));          // enter edit mode
    const input = screen.getByDisplayValue(baseQuestion.text);
    await userEvent.clear(input);
    await userEvent.type(input, 'Edited!');
    fireEvent.blur(input);
    expect(onTitleChange).toHaveBeenCalledWith(baseQuestion.id, 'Edited!');
    expect(screen.getByText('Edited!')).toBeInTheDocument();
  });

  test('pressing Enter also commits after clearing default', async () => {
    renderEditable();
    await userEvent.click(screen.getByRole('button'));
    const input = screen.getByDisplayValue(baseQuestion.text);
    await userEvent.clear(input);
    await userEvent.type(input, 'New{enter}');
    expect(onTitleChange).toHaveBeenCalledWith(baseQuestion.id, 'New');
  });

  test('clicking cancel reverts without calling onTitleChange', async () => {
    renderEditable();
    await userEvent.click(screen.getByRole('button'));
    const input = screen.getByDisplayValue(baseQuestion.text);
    await userEvent.type(input, 'Throw‑away');
    // only one button exists in edit mode (the cancel)
    const cancelBtn = screen.getByRole('button');
    await userEvent.click(cancelBtn);
    expect(onTitleChange).not.toHaveBeenCalled();
    expect(screen.getByText(baseQuestion.text)).toBeInTheDocument();
  });

  test('passes showTitle=false to Question (no label)', () => {
    renderEditable();
    expect(screen.queryByLabelText(baseQuestion.text)).toBeNull();
  });
});

describe('<Question>', () => {
  test('text type calls onAnswerChange for each keystroke', async () => {
    const q = buildQuestion({ type: 'text' });
    const spy = jest.fn();
    render(<Question question={q} onAnswerChange={spy} value="" />);
    const input = screen.getByPlaceholderText(/your answer/i);
    await userEvent.type(input, 'Alice');
    expect(spy).toHaveBeenCalledTimes(5);
    expect(spy.mock.calls.map(c => c[1])).toEqual(['A','l','i','c','e']);
    spy.mock.calls.forEach(call => {
      expect(call[0]).toBe(q.id);
    });
  });

  test('radio type reports the selected option', async () => {
    const q = buildQuestion({ type: 'radio', options: ['Red','Blue'] });
    const spy = jest.fn();
    render(<Question question={q} onAnswerChange={spy} value="" />);
    await userEvent.click(screen.getByLabelText('Blue'));
    expect(spy).toHaveBeenCalledWith(q.id, 'Blue');
  });

  test('checkbox type toggles values array', async () => {
    const q = buildQuestion({ type: 'checkbox', options: ['Vanilla','Chocolate'] });
    const spy = jest.fn();
    render(<Question question={q} onAnswerChange={spy} value={[]} />);
    const vanilla = screen.getByLabelText('Vanilla');
    const choco   = screen.getByLabelText('Chocolate');

    await userEvent.click(vanilla);
    expect(spy).toHaveBeenLastCalledWith(q.id, ['Vanilla']);

    await userEvent.click(choco);
    expect(spy).toHaveBeenLastCalledWith(q.id, ['Vanilla','Chocolate']);

    await userEvent.click(vanilla);
    expect(spy).toHaveBeenLastCalledWith(q.id, ['Chocolate']);
  });

  test('disabled prevents interaction', async () => {
    const q = buildQuestion({ type: 'text' });
    const spy = jest.fn();
    render(<Question question={q} onAnswerChange={spy} value="" disabled />);
    const input = screen.getByPlaceholderText(/responders will answer with text/i);
    expect(input).toBeDisabled();
    await userEvent.type(input, 'ignored');
    expect(spy).not.toHaveBeenCalled();
  });
});

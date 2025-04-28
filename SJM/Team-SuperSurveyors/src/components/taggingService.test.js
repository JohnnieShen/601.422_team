jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  doc: jest.fn(),
  runTransaction: jest.fn()
}));

jest.mock('../firebase', () => ({
  db: {}
}));
import { generateTagsForSurvey, updateUserTags } from './taggingService';
import { OpenAI } from 'openai';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
const mockCreate = OpenAI.mock.results[0].value.chat.completions.create;
describe('generateTagsForSurvey', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should generate tags from valid input', async () => {
    const mockResponse = {
      choices: [{
        message: { content: ' Education' }
      }]
    };
    mockCreate.mockResolvedValue(mockResponse);

    const result = await generateTagsForSurvey('Student Survey', [
      'What is your favorite subject?',
      'How many hours do you study daily?'
    ]);

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: expect.stringContaining('Student Survey')
      }]
    });
    expect(result).toEqual(['Education']);
  });

  test('should handle empty input', async () => {
    const result = await generateTagsForSurvey('', []);
    expect(result).toEqual([]);
  });

  test('should handle API errors', async () => {
    mockCreate.mockRejectedValue(new Error('API Error'));
    const result = await generateTagsForSurvey('Test Survey', ['Question 1']);
    expect(result).toEqual([]);
  });

  test('should handle unexpected response format', async () => {
    mockCreate.mockResolvedValue({ choices: [] });
    const result = await generateTagsForSurvey('Test', ['Q1']);
    expect(result).toEqual([]);
  });
  test('trims whitespace and returns only the first tag from a comma‑separated list', async () => {
  // Simulate GPT returning multiple comma‑separated tags with extra spaces
  mockCreate.mockResolvedValue({
    choices: [{
      message: { content: '  Education, Science, Math  ' }
    }]
  });

  const result = await generateTagsForSurvey('Any Survey', [
    'Question 1?',
    'Question 2?'
  ]);

  // It should call the API
  expect(mockCreate).toHaveBeenCalledWith({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: expect.stringContaining('Any Survey')
    }]
  });

  // And return only the first trimmed tag
  expect(result).toEqual(['Education']);
});

});

describe('updateUserTags', () => {
  const mockTransaction = {
    get: jest.fn(),
    update: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    doc.mockReturnValue('user-ref');
    runTransaction.mockImplementation(async (db, callback) => {
      await callback(mockTransaction);
    });
  });

  test('should add new tag to user document', async () => {
    const existingTags = ['old-tag'];
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ tags: existingTags })
    });

    await updateUserTags('user123', 'new-tag');

    expect(mockTransaction.update).toHaveBeenCalledWith('user-ref', {
      tags: ['old-tag', 'new-tag']
    });
  });

  test('should not add duplicate tags', async () => {
    const existingTags = ['existing-tag'];
    mockTransaction.get.mockResolvedValue({
      exists: () => true,
      data: () => ({ tags: existingTags })
    });

    await updateUserTags('user123', 'existing-tag');

    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  test('should handle non-existent user document', async () => {
    mockTransaction.get.mockResolvedValue({
      exists: () => false
    });

    await updateUserTags('user123', 'new-tag');

    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  test('should handle empty newTag', async () => {
    await updateUserTags('user123', '');
    expect(runTransaction).not.toHaveBeenCalled();
  });

  test('should handle transaction errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    runTransaction.mockRejectedValue(new Error('DB Error'));
    
    await updateUserTags('user123', 'valid-tag');
    
    expect(consoleSpy).toHaveBeenCalledWith('Error updating user tags:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
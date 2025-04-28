import {
    getUserSurveys,
    getRandomSurvey,
    getTrendingSurveys,
    getSurveyInfo,
    getSurveyResponses,
    updateSurvey,
    checkCurrency,
    updateCurrency,
  } from './surveyService';
  
  jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({ currentUser: { uid: 'user123' } })),
  }));
  
  jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn().mockReturnValue({}),
    collection: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    documentId: jest.fn(),
    setDoc: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    orderBy: jest.fn(),
  }));
  
  import {
    getFirestore,
    collection,
    getDocs,
    query,
    where,
    documentId,
    setDoc,
    doc,
    getDoc,
    orderBy,
  } from 'firebase/firestore';
  import { getAuth as _noop } from 'firebase/auth';
  
  beforeEach(() => {
    jest.resetAllMocks();
    getFirestore.mockReturnValue({});
    collection.mockImplementation((db, ...args) => ({ _collection: args }));
    query.mockImplementation((...args) => ({ _query: args }));
    where.mockImplementation((...args) => ({ _where: args }));
    documentId.mockReturnValue('__docId__');
    orderBy.mockImplementation((...args) => ({ _orderBy: args }));
    doc.mockImplementation((db, ...args) => ({ _doc: args }));
  });
  
  describe('getUserSurveys', () => {
    it('returns undefined if user has no surveys', async () => {
      getDocs
        .mockResolvedValueOnce({ docs: [{ data: () => ({ surveys: [] }) }] });
      const result = await getUserSurveys();
      expect(result).toBeUndefined();
      expect(getDocs).toHaveBeenCalledTimes(1);
    });
  
    it('fetches and returns surveys data when present', async () => {
      getDocs
        // first call: users query
        .mockResolvedValueOnce({ docs: [{ data: () => ({ surveys: ['s1','s2'] }) }] })
        // second call: surveys query
        .mockResolvedValueOnce({
          docs: [
            { id: 's1', data: () => ({ foo: 'bar' }) },
            { id: 's2', data: () => ({ baz: 'qux' }) },
          ],
        });
  
      const surveys = await getUserSurveys();
      expect(surveys).toEqual([
        { id: 's1', foo: 'bar' },
        { id: 's2', baz: 'qux' },
      ]);
      expect(getDocs).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getRandomSurvey', () => {
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });
    afterEach(() => {
      Math.random.mockRestore();
    });
  
    it('returns a filtered random survey the user hasn’t created or answered', async () => {
      getDocs
        // user query
        .mockResolvedValueOnce({
          docs: [{
            data: () => ({
              surveys: ['own1'],
              answeredSurveys: ['ans1'],
            }),
          }],
        })
        // surveys query
        .mockResolvedValueOnce({
          docs: [
            { id: 'own1', data: () => ({ title: 'x', questions: [1] }) },
            { id: 'ok1',  data: () => ({ title: 'Y', questions: [1] }) },
            { id: 'ans1', data: () => ({ title: 'Z', questions: [1] }) },
            { id: 'bad',  data: () => ({ title: '',  questions: [] }) },
          ],
        });
  
      const s = await getRandomSurvey();
      expect(s).toEqual({ id: 'ok1', title: 'Y', questions: [1] });
    });
  });
  
  describe('getTrendingSurveys', () => {
    it('returns top 10 publicly shared trending surveys', async () => {
      getDocs
        // first: surveyResults
        .mockResolvedValueOnce({
          docs: [
            { id: 't1', data: () => ({ responseCount: 20 }) },
            { id: 't2', data: () => ({ responseCount: 10 }) },
          ],
        })
        // second: surveys details, now with forEach
        .mockResolvedValueOnce({
          docs: [
            { id: 't1', data: () => ({ sharePublicly: true, title: 'A', tags: ['a'] }) },
            { id: 't2', data: () => ({ sharePublicly: false, title: 'B', tags: ['b'] }) },
          ],
          forEach(cb) { this.docs.forEach(cb); },
        });
  
      const trends = await getTrendingSurveys();
      expect(trends).toEqual([
        { id: 't1', responseCount: 20, title: 'A', tags: ['a'] },
      ]);
      expect(getDocs).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getSurveyInfo', () => {
    it('fetches and returns single survey data', async () => {
      getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ q: 'foo' }) }],
      });
      const info = await getSurveyInfo('survey123');
      expect(info).toEqual({ q: 'foo' });
    });
  });
  
  describe('getSurveyResponses', () => {
    it('collects and returns all question responses', async () => {
      const docs = [
        { data: () => ({ responses: [1, 2] }) },
        { data: () => ({ responses: [3] }) },
      ];
      // only one mock, with forEach
      getDocs.mockResolvedValueOnce({
        forEach(cb) { docs.forEach(cb); },
      });
  
      const res = await getSurveyResponses('sid');
      expect(res).toEqual([
        { responses: [1, 2] },
        { responses: [3] },
      ]);
      expect(getDocs).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('updateSurvey', () => {
    it('calls setDoc with correct document ref and data', async () => {
      setDoc.mockResolvedValue();
      await updateSurvey('sid', { foo: 1 });
  
      // doc() was called once to build the ref
      expect(doc).toHaveBeenCalledWith({}, 'surveys', 'sid');
  
      // grab that same ref out of the mock results
      const docRef = doc.mock.results[0].value;
      expect(setDoc).toHaveBeenCalledWith(docRef, { foo: 1 });
    });
  });
  
  describe('checkCurrency & updateCurrency', () => {
    it('checkCurrency returns true when coins > 2, false otherwise', async () => {
      // exists true, coins 5
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data:   () => ({ coins: 5 }),
      });
      expect(await checkCurrency()).toBe(true);
  
      // exists true, coins 2
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data:   () => ({ coins: 2 }),
      });
      expect(await checkCurrency()).toBe(false);
  
      // no doc
      getDoc.mockResolvedValueOnce({ exists: () => false });
      expect(await checkCurrency()).toBe(false);
    });
  
    it('updateCurrency reads, increments, and writes back coins', async () => {
      getDoc.mockResolvedValueOnce({ data: () => ({ coins: 10 }) });
      setDoc.mockResolvedValue();
  
      await updateCurrency(-3);
  
      // first doc() call is to read, second to write
      expect(doc).toHaveBeenCalledWith({}, 'users', 'user123');
      const writeRef = doc.mock.results[1].value;
      expect(setDoc).toHaveBeenCalledWith(writeRef, { coins: 7 });
    });
    
  });
  describe('error‑handling and edge cases', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      console.error.mockRestore();
    });
  
    it('logs and returns undefined when getUserSurveys throws', async () => {
      getDocs.mockRejectedValueOnce(new Error('firestore down'));
      const res = await getUserSurveys();
      expect(res).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching the user's surveys:",
        expect.any(Error)
      );
    });
  
    it('uses no‑surveys branch in getRandomSurvey', async () => {
      getDocs
        .mockResolvedValueOnce({ docs: [{ data: () => ({ surveys: [], answeredSurveys: [] }) }] })
        .mockResolvedValueOnce({
          docs: [
            { id: 'one', data: () => ({ title: 'T1', questions: [1] }) },
            { id: 'two', data: () => ({ title: 'T2', questions: [2] }) },
          ]
        });
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
  
      const s = await getRandomSurvey();
      // 2nd call to `query` should be just the surveys collection
      expect(query.mock.calls[1]).toEqual([collection({}, 'surveys')]);
      expect(s).toEqual({ id: 'two', title: 'T2', questions: [2] });
  
      Math.random.mockRestore();
    });
  
    it('logs and returns undefined when getRandomSurvey inner fetch fails', async () => {
      getDocs
        .mockResolvedValueOnce({ docs: [{ data: () => ({ surveys: ['x'], answeredSurveys: [] }) }] })
        .mockRejectedValueOnce(new Error('boom'));
      const res = await getRandomSurvey();
      expect(res).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching surveys:',
        expect.any(Error)
      );
    });
  
    it('logs and returns undefined when getTrendingSurveys first fetch throws', async () => {
      getDocs.mockRejectedValueOnce(new Error('no results'));
      const res = await getTrendingSurveys();
      expect(res).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching trending surveys:',
        expect.any(Error)
      );
    });
  
    it('filters public surveys and slices to 10 in getTrendingSurveys', async () => {
        // 12 fake result docs with increasing responseCount
        const resultsData = Array.from({ length: 12 }, (_, i) => ({
          id: `s${i}`,
          data: () => ({ responseCount: i })
        }));
      
        // First getDocs: surveyResults
        getDocs.mockResolvedValueOnce({ docs: resultsData });
      
        // Prepare detail docs and stub surveysSnapshot.forEach(...)
        const detailDocs = resultsData.map(r => ({
          id: r.id,
          data: () => ({
            sharePublicly: parseInt(r.id.slice(1), 10) % 2 === 0,  // evens only
            title: `Title${r.id}`,
            tags: [r.id]
          })
        }));
        getDocs.mockResolvedValueOnce({
          forEach: cb => detailDocs.forEach(cb)
        });
      
        const trends = await getTrendingSurveys();
      
        // Construct expected: only even‐indexed, sliced to first 10, mapped
        const expected = resultsData
          .filter(r => parseInt(r.id.slice(1), 10) % 2 === 0)
          .slice(0, 10)
          .map(r => ({
            id: r.id,
            responseCount: r.data().responseCount,
            title: `Title${r.id}`,
            tags: [r.id]
          }));
      
        expect(trends).toEqual(expected);
      });
  
    it('logs and returns undefined when getSurveyInfo throws', async () => {
      getDocs.mockRejectedValueOnce(new Error('missing'));
      const res = await getSurveyInfo('abc');
      expect(res).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching survey questions: ',
        expect.any(Error)
      );
    });
  
    it('returns [] when getSurveyResponses has no docs', async () => {
        // Stub getDocs to return an object with a no‑op forEach
        getDocs.mockResolvedValueOnce({
          forEach: () => {}
        });
      
        const res = await getSurveyResponses('anySurveyId');
        expect(res).toEqual([]);
      });
  
    it('logs and returns undefined when updateSurvey throws', async () => {
      setDoc.mockRejectedValueOnce(new Error('disk full'));
      const res = await updateSurvey('sid', { a: 1 });
      expect(res).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Error updating survey:',
        expect.any(Error)
      );
    });
    it('correctly filters, maps, and slices to 10 in getTrendingSurveys mapping block', async () => {
      const results = Array.from({ length: 12 }, (_, i) => ({
        id: `survey${i}`,
        data: () => ({ responseCount: i })
      }));
      // first getDocs: surveyResults
      getDocs.mockResolvedValueOnce({ docs: results });
  
      // second getDocs: survey details, now with forEach
      const detailDocs = results.map(r => ({
        id: r.id,
        data: () => ({
          sharePublicly: parseInt(r.id.replace('survey',''), 10) % 3 !== 0,
          title: `Title for ${r.id}`,
          tags: [r.id]
        })
      }));
      getDocs.mockResolvedValueOnce({
        docs: detailDocs,
        forEach(cb) { this.docs.forEach(cb); },
      });
  
      const surveys = await getTrendingSurveys();
      const expected = results
        .filter(r => parseInt(r.id.replace('survey',''), 10) % 3 !== 0)
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          responseCount: r.data().responseCount,
          title: `Title for ${r.id}`,
          tags: [r.id]
        }));
  
      expect(surveys).toEqual(expected);
    });
      it('collects and returns all question responses via forEach push', async () => {
        // arrange: two fake question‐response docs
        const fakeDocs = [
          { data: () => ({ responses: [1, 2] }) },
          { data: () => ({ responses: [3] }) },
        ];
      
        // make getDocs return an object with a forEach that iterates our fakeDocs
        getDocs.mockResolvedValueOnce({
          forEach(cb) {
            fakeDocs.forEach(cb);
          }
        });
      
        // act
        const result = await getSurveyResponses('surveyXYZ');
      
        // assert that we got exactly what we pushed
        expect(result).toEqual([
          { responses: [1, 2] },
          { responses: [3] }
        ]);
      
        // also ensure we called collection with the right path
        expect(collection).toHaveBeenCalledWith(
          {},
          'surveyResults',
          'surveyXYZ',
          'questions'
        );
      });
      
  });
  
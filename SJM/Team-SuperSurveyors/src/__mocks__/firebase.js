export const initializeApp = jest.fn(() => ({
    // Mock app instance
    auth: jest.fn(),
    firestore: jest.fn(),
  }));
  
  export const getFirestore = jest.fn();
  export const getAuth = jest.fn(() => ({
    currentUser: { uid: 'test-user' },
    onAuthStateChanged: jest.fn(),
  }));
  export const GoogleAuthProvider = jest.fn(() => ({
    addScope: jest.fn(),
    setCustomParameters: jest.fn(),
  }));
  // Mock other Firebase services as needed
  export const doc = jest.fn();
  export const getDoc = jest.fn();
  export const collection = jest.fn();
  export const getDocs = jest.fn();
  export const updateDoc = jest.fn();
  export const runTransaction = jest.fn();
  export const query = jest.fn();
  export const where = jest.fn();
  export const increment = jest.fn();


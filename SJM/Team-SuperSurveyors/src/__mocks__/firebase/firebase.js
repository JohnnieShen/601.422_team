const fns = {
    getFirestore : jest.fn(),
    collection   : jest.fn(),
    addDoc       : jest.fn(),
    setDoc       : jest.fn(),
    doc          : jest.fn(),
    getDoc       : jest.fn(),
    getDocs      : jest.fn(),
    updateDoc    : jest.fn(),
    runTransaction: jest.fn(),
    query        : jest.fn(),
    where        : jest.fn(),
    increment    : jest.fn(),
  };
  
  module.exports = { __esModule: true, ...fns, default: fns };
  
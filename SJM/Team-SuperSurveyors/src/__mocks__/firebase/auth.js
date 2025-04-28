const m = {
    getAuth: jest.fn(() => ({
      currentUser: { uid: 'test-user' },   // what your components expect
    })),
  };
  
  module.exports = { __esModule: true, ...m, default: m };
  
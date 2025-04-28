import '@testing-library/jest-dom';

const { TextEncoder, TextDecoder } = require('text-encoding');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;
jest.mock('firebase/auth', () => ({
    ...jest.requireActual('firebase/auth'),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
      addScope: jest.fn(),
      setCustomParameters: jest.fn()
    }))
  }));
jest.mock('@mui/material/styles', () => {
    // pull in every real export except `styled`
    const actual = jest.requireActual('@mui/material/styles');
  
    // a super‑simple fake: returns a component that just renders its children
    const fakeStyled = () =>
      ({ children, ...rest }) => <div {...rest}>{children}</div>;
  
    return { __esModule: true, ...actual, styled: fakeStyled };
  });
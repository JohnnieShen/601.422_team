jest.mock('./components/NavBar', () => () => <div>NavBar</div>);
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn((auth, cb) => {
    cb(null);
    return () => {};
  }),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';

jest.mock('./components/LandingPage', () => () => <div>LandingPage</div>);
jest.mock('./components/Login', () => () => <div>Login</div>);
jest.mock('./components/Signup', () => () => <div>Signup</div>);
jest.mock('./components/Onboarding', () => () => <div>Onboarding</div>);
jest.mock('./components/SurveyView', () => () => <div>SurveyView</div>);
jest.mock('./components/Survey', () => () => <div>SurveyForm</div>);
jest.mock('./components/UserView', () => () => <div>UserView</div>);
jest.mock('./components/answerSurvey', () => () => <div>AnswerSurvey</div>);
jest.mock('./components/TrendingView', () => () => <div>TrendingView</div>);
jest.mock('./components/SurveyDetailView', () => () => <div>SurveyDetailView</div>);
jest.mock('./components/SurveyResults',  () => () => <div>SurveyResults</div>);

jest.mock('./routes/PrivateRoutes', () => {
  const { Outlet } = require('react-router-dom');
  return () => <Outlet />;
});

beforeAll(() => {
  document.body.innerHTML = '<div id="root"></div>';
});

describe('App routing', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '#/');
  });

  const renderWithHash = (hash) => {
    window.history.pushState({}, '', `#${hash}`);
    render(<App />);
  };

  test('renders LandingPage on root path', () => {
    renderWithHash('/');
    expect(screen.getByText('LandingPage')).toBeInTheDocument();
    expect(screen.queryByText('NavBar')).not.toBeInTheDocument();
  });

  test('renders Login and NavBar on /login', () => {
    renderWithHash('/login');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('renders Signup and NavBar on /signup', () => {
    renderWithHash('/signup');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('Signup')).toBeInTheDocument();
  });

  test('renders Onboarding with userId param and NavBar', () => {
    renderWithHash('/onboarding/123');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('Onboarding')).toBeInTheDocument();
  });

  test('renders SurveyView and NavBar on protected /home', () => {
    renderWithHash('/home');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('SurveyView')).toBeInTheDocument();
  });

  test('renders SurveyForm and NavBar on protected /create', () => {
    renderWithHash('/create');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('SurveyForm')).toBeInTheDocument();
  });

  test('renders UserView and NavBar on protected /profile', () => {
    renderWithHash('/profile');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('UserView')).toBeInTheDocument();
  });

  test('renders AnswerSurvey and NavBar on protected /answer/:surveyId', () => {
    renderWithHash('/answer/abc123');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('AnswerSurvey')).toBeInTheDocument();
  });

  test('renders TrendingView and NavBar on protected /trending', () => {
    renderWithHash('/trending');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('TrendingView')).toBeInTheDocument();
  });

  test('renders SurveyDetailView and NavBar on protected /survey-view/:surveyId', () => {
    renderWithHash('/survey-view/xyz');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('SurveyDetailView')).toBeInTheDocument();
  });

  test('renders SurveyResults and NavBar on protected /survey-results/:surveyId', () => {
    renderWithHash('/survey-results/xyz');
    expect(screen.getByText('NavBar')).toBeInTheDocument();
    expect(screen.getByText('SurveyResults')).toBeInTheDocument();
  });

  test('redirects unknown paths to LandingPage', () => {
    renderWithHash('/some/random/path');
    expect(screen.getByText('LandingPage')).toBeInTheDocument();
  });
});

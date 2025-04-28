import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './LandingPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main title and subtitle', () => {
    expect(screen.getByText('SuperSurveyors')).toBeInTheDocument();
    expect(screen.getByText('Revolutionizing Survey Distribution')).toBeInTheDocument();
  });

  it('navigates to signup when Get Started button is clicked', () => {
    const button = screen.getByText('Get Started');
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('navigates to login when Sign In button is clicked', () => {
    const button = screen.getByText('Sign In');
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('displays all feature cards', () => {
    const features = [
      'Survey Creation',
      'Survey Coins',
      'Analytics',
      'Categorization',
    ];
    
    features.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('shows How It Works sections for both creators and participants', () => {
    expect(screen.getByText('For Survey Creators')).toBeInTheDocument();
    expect(screen.getByText('For Participants')).toBeInTheDocument();
    expect(screen.getByText('Create surveys')).toBeInTheDocument();
    expect(screen.getByText('Earn coins')).toBeInTheDocument();
  });

  it('displays all team members with correct GitHub links', () => {
    const teamMembers = [
      { name: 'Larry Cai', github: 'larrythelog' },
      { name: 'Jianwei Chen', github: 'jchen362' },
      { name: 'Mia Jin', github: 'zhengyue4499' },
      { name: 'Noah Park', github: 'noahpark101' },
      { name: 'Xin Tan', github: 'tanx3036' },
      { name: 'Jiayi Zhang', github: 'jiayizhang-evelynn' },
    ];

    teamMembers.forEach(member => {
      expect(screen.getByText(member.name)).toBeInTheDocument();
      const link = screen.getByText(member.github);
      expect(link.closest('a')).toHaveAttribute(
        'href',
        `https://github.com/${member.github}`
      );
    });
  });

  it('renders the footer copyright', () => {
    expect(
      screen.getByText(/© 2024 SuperSurveyors. All rights reserved./i)
    ).toBeInTheDocument();
  });
});
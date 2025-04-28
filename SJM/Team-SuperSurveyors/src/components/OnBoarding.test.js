import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import Onboarding from './Onboarding';

const mockTags = [
  { id: 'Sports',  name: 'Sports',  image: '/sports.jpg'  },
  { id: 'Music',   name: 'Music',   image: '/music.jpg'   },
  { id: 'Travel',  name: 'Travel',  image: '/travel.jpg'  },
  { id: 'Books',   name: 'Books',   image: '/books.jpg'   },
  { id: 'Tech',    name: 'Tech',    image: '/tech.jpg'    },
  { id: 'Movies',  name: 'Movies',  image: '/movies.jpg'  },
];

jest.mock('firebase/firestore', () => ({
  __esModule: true,
  collection: jest.fn(),
  doc: jest.fn(() => ({})),
  updateDoc: jest.fn(),
  getDocs: jest.fn(() => ({
    docs: mockTags.map(t => ({
      id: t.id,
      data: () => ({ name: t.name, image: t.image })
    }))
  })),
}));

jest.mock('../firebase', () => ({
  __esModule: true,
  db: {},
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  __esModule: true,
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ userId: 'uid‑123' }),
}));

const MIN_TAGS = 5;

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/onboarding/uid-123']}>
      <Routes>
        <Route path="/onboarding/:userId" element={<Onboarding />} />
      </Routes>
    </MemoryRouter>
  );

describe('<Onboarding />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
  });

  test('fetches & displays tags from Firestore', async () => {
    renderPage();

    for (const tag of mockTags) {
      expect(await screen.findByText(tag.name)).toBeInTheDocument();
    }
  });

  test('selecting tags updates progress bar and button text', async () => {
    renderPage();

    await screen.findByText('Sports');

    const firstThree = mockTags.slice(0, 3).map(t => screen.getByText(t.name));
    firstThree.forEach(btn => fireEvent.click(btn));

    expect(screen.getByText(`3 of ${MIN_TAGS} required`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select 2 more/i })).toBeDisabled();

    const nextTwo = mockTags.slice(3, 5).map(t => screen.getByText(t.name));
    nextTwo.forEach(btn => fireEvent.click(btn));

    expect(screen.getByRole('button', { name: /complete selection/i })).toBeEnabled();
  });

  test('updates Firestore and navigates when minimum reached', async () => {
    const { updateDoc } = require('firebase/firestore');
    renderPage();

    await screen.findByText('Sports');

    mockTags.slice(0, MIN_TAGS).forEach(t =>
      fireEvent.click(screen.getByText(t.name))
    );

    fireEvent.click(screen.getByRole('button', { name: /complete selection/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
        tags: expect.arrayContaining(mockTags.slice(0, MIN_TAGS).map(t => t.id))
      });
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });
});

describe('<Onboarding /> – extra coverage', () => {
  const { getDocs, updateDoc } = require('firebase/firestore');
  const mockTagsLocal = mockTags;
  const min = 5;
  let consoleErrorSpy;

  beforeEach(async () => {
    jest.clearAllMocks();
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    getDocs.mockResolvedValue({
      docs: mockTagsLocal.map(t => ({ id: t.id, data: () => ({ name: t.name, image: t.image }) }))
    });
    renderPage();
    await screen.findByText(mockTagsLocal[0].name);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('setTags → renders one card per tag', () => {
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(mockTagsLocal.length);
    mockTagsLocal.forEach(t => {
      expect(screen.getByAltText(t.id)).toBeInTheDocument();
    });
  });

  test('toggleTagSelection adds and removes tags', () => {
    fireEvent.click(screen.getByText(mockTagsLocal[0].name));
    expect(screen.getByText(`1 of ${min} required`)).toBeInTheDocument();
    fireEvent.click(screen.getByText(mockTagsLocal[0].name));
    expect(screen.getByText(`0 of ${min} required`)).toBeInTheDocument();
  });

  test('handleComplete logs error and stays if updateDoc throws', async () => {
    mockTagsLocal.slice(0, min).forEach(t =>
      fireEvent.click(screen.getByText(t.name))
    );

    updateDoc.mockRejectedValue(new Error('fail update'));

    fireEvent.click(screen.getByRole('button', { name: /complete selection/i }));

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating user tags:',
        expect.any(Error)
      )
    );
    expect(mockNavigate).not.toHaveBeenCalledWith('/profile');
  });
  test('navigates to /profile when user picks more than the minimum tags', async () => {
    const { updateDoc } = require('firebase/firestore');

    renderPage();
    await screen.findByText('Sports');

    mockTags.slice(0, 6).forEach(t =>
      fireEvent.click(screen.getByText(t.name))
    );

    fireEvent.click(screen.getByRole('button', { name: /complete selection/i }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { tags: expect.arrayContaining(mockTags.slice(0, 6).map(t => t.id)) }
      );

      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });
});
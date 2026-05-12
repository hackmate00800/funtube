import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Library from '../../pages/Library';

var MOCK_USER = {
  _id: 'user123',
  id: 'user123',
  username: 'TestUser',
  likedVideos: [],
  watchLater: [],
  watchHistory: [],
};

jest.mock('../../context/AuthContext', () => {
  const react = require('react');
  return {
    AuthContext: react.createContext({ user: MOCK_USER }),
  };
});

jest.mock('../../services/api', () => ({
  videosAPI: {
    getVideo: jest.fn(() => Promise.resolve({ data: { data: { _id: 'v1', title: 'Test Video' } } })),
  },
}));

const renderLibrary = () => {
  const AuthContext = require('../../context/AuthContext').AuthContext;
  return render(
    <AuthContext.Provider value={{ user: MOCK_USER }}>
      <MemoryRouter>
        <Library />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Library Page', () => {
  it('renders the library title', () => {
    renderLibrary();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders tab buttons', () => {
    renderLibrary();
    expect(screen.getByText('Liked Videos')).toBeInTheDocument();
    expect(screen.getByText('Watch Later')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('shows Liked Videos tab by default', async () => {
    renderLibrary();
    expect(await screen.findByText('No liked videos')).toBeInTheDocument();
  });

  it('switches to Watch Later tab when clicked', async () => {
    renderLibrary();
    expect(await screen.findByText('Liked Videos')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Watch Later'));
    expect(await screen.findByText('No saved videos')).toBeInTheDocument();
  });

  it('switches to History tab when clicked', async () => {
    renderLibrary();
    await screen.findByText('No liked videos');
    fireEvent.click(screen.getByText('History'));
    expect(screen.getByText('No watch history')).toBeInTheDocument();
  });

  it('displays video count in tab buttons', async () => {
    renderLibrary();
    await screen.findByText('No liked videos');
    expect(screen.getAllByText(/\(0\)/)).toHaveLength(3);
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';

jest.mock('../../context/AuthContext', () => {
  const react = require('react');
  return { AuthContext: react.createContext({ user: null }) };
});

describe('Sidebar', () => {
  it('renders main navigation links', () => {
    const AuthContext = require('../../context/AuthContext').AuthContext;
    render(
      <AuthContext.Provider value={{ user: null }}>
        <MemoryRouter>
          <Sidebar sidebarCollapsed={false} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
  });

  it('renders library links when expanded', () => {
    const AuthContext = require('../../context/AuthContext').AuthContext;
    render(
      <AuthContext.Provider value={{ user: null }}>
        <MemoryRouter>
          <Sidebar sidebarCollapsed={false} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getAllByText('Library')).toHaveLength(2);
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Watch Later')).toBeInTheDocument();
    expect(screen.getByText('Liked Videos')).toBeInTheDocument();
  });

  it('shows Create Channel for non-creator users', () => {
    const AuthContext = require('../../context/AuthContext').AuthContext;
    render(
      <AuthContext.Provider value={{ user: { id: '123', role: 'user' } }}>
        <MemoryRouter>
          <Sidebar sidebarCollapsed={false} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Create Channel')).toBeInTheDocument();
    expect(screen.queryByText('Your Channel')).not.toBeInTheDocument();
  });

  it('shows Your Channel for creator users', () => {
    const AuthContext = require('../../context/AuthContext').AuthContext;
    render(
      <AuthContext.Provider value={{ user: { id: '123', role: 'creator' } }}>
        <MemoryRouter>
          <Sidebar sidebarCollapsed={false} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Your Channel')).toBeInTheDocument();
    expect(screen.queryByText('Create Channel')).not.toBeInTheDocument();
  });

  it('renders Dashboard link for all users', () => {
    const AuthContext = require('../../context/AuthContext').AuthContext;
    render(
      <AuthContext.Provider value={{ user: { id: '123', role: 'creator' } }}>
        <MemoryRouter>
          <Sidebar sidebarCollapsed={false} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('does not render library section when collapsed', () => {
    const AuthContext = require('../../context/AuthContext').AuthContext;
    render(
      <AuthContext.Provider value={{ user: null }}>
        <MemoryRouter>
          <Sidebar sidebarCollapsed={true} />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.queryByText('Library')).not.toBeInTheDocument();
    expect(screen.queryByText('History')).not.toBeInTheDocument();
  });
});

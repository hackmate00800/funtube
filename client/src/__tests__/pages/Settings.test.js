import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../../pages/Settings';

var MOCK_CHANGE_LANGUAGE = jest.fn();

jest.mock('../../context/AuthContext', () => {
  const react = require('react');
  return { AuthContext: react.createContext({ user: null, updateProfile: jest.fn() }) };
});

jest.mock('../../context/ThemeContext', () => {
  const react = require('react');
  return { ThemeContext: react.createContext({ isDark: true, toggleTheme: jest.fn() }) };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en', changeLanguage: MOCK_CHANGE_LANGUAGE },
  }),
}));

jest.mock('../../utils/i18n', () => ({
  language: 'en',
  changeLanguage: (lng) => MOCK_CHANGE_LANGUAGE(lng),
}));

const renderSettings = (user = { username: 'TestUser', channelDescription: '' }) => {
  const AuthContext = require('../../context/AuthContext').AuthContext;
  const ThemeContext = require('../../context/ThemeContext').ThemeContext;
  return render(
    <AuthContext.Provider value={{ user, updateProfile: jest.fn() }}>
      <ThemeContext.Provider value={{ isDark: true, toggleTheme: jest.fn() }}>
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
};

describe('Settings Page', () => {
  beforeEach(() => {
    MOCK_CHANGE_LANGUAGE.mockClear();
  });

  it('renders profile tab by default', () => {
    renderSettings();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('renders language tab when clicked', () => {
    renderSettings();
    fireEvent.click(screen.getByText('Language'));
    expect(screen.getByText('Language & Region')).toBeInTheDocument();
  });

  it('renders appearance tab when clicked', () => {
    renderSettings();
    fireEvent.click(screen.getByText('Appearance'));
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  });

  it('renders notifications tab when clicked', () => {
    renderSettings();
    fireEvent.click(screen.getByText('Notifications'));
    expect(screen.getByText('Push Notifications')).toBeInTheDocument();
  });

  it('shows language selector with three options', () => {
    renderSettings();
    fireEvent.click(screen.getByText('Language'));
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.children.length).toBe(3);
    expect(select.children[0].value).toBe('en');
    expect(select.children[1].value).toBe('es');
    expect(select.children[2].value).toBe('fr');
  });

  it('calls changeLanguage when selecting a different language', () => {
    renderSettings();
    fireEvent.click(screen.getByText('Language'));
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'es' } });
    expect(MOCK_CHANGE_LANGUAGE).toHaveBeenCalledWith('es');
  });

  it('renders all navigation tabs', () => {
    renderSettings();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });
});

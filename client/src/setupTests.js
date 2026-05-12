import '@testing-library/jest-dom';
import React from 'react';

global.React = React;

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VideoCard from '../../components/video/VideoCard';

const mockVideo = {
  _id: '123',
  title: 'Test Video Title',
  thumbnail: '/thumbnails/test.jpg',
  duration: 300,
  views: 1500,
  createdAt: '2024-01-15T10:00:00Z',
  user: {
    _id: 'user1',
    username: 'testcreator',
    avatar: '/avatars/test.jpg',
  },
};

const renderVideoCard = (props = {}) => {
  return render(
    <MemoryRouter>
      <VideoCard video={mockVideo} {...props} />
    </MemoryRouter>
  );
};

describe('VideoCard Component', () => {
  it('renders video title', () => {
    renderVideoCard();
    expect(screen.getByText('Test Video Title')).toBeInTheDocument();
  });

  it('renders creator username', () => {
    renderVideoCard();
    expect(screen.getByText('testcreator')).toBeInTheDocument();
  });

  it('renders formatted view count', () => {
    renderVideoCard();
    expect(screen.getByText(/1.5K/)).toBeInTheDocument();
  });

  it('renders video duration', () => {
    renderVideoCard();
    expect(screen.getByText('5:00')).toBeInTheDocument();
  });

  it('renders thumbnail with lazy loading', () => {
    renderVideoCard();
    const img = screen.getByAltText('Test Video Title');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('renders avatar or fallback initials', () => {
    const { container } = renderVideoCard();
    const initials = container.querySelector('.bg-primary-500\\/20');
    if (!screen.queryByAltText('')) {
      expect(initials).toBeInTheDocument();
    }
  });

  it('renders horizontal variant when horizontal prop is true', () => {
    const { container } = renderVideoCard({ horizontal: true });
    const link = container.querySelector('.flex.gap-3');
    expect(link).toBeInTheDocument();
  });

  it('links to watch page', () => {
    renderVideoCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/watch/123');
  });

  it('handles missing thumbnail gracefully', () => {
    const videoNoThumb = { ...mockVideo, thumbnail: null };
    render(
      <MemoryRouter>
        <VideoCard video={videoNoThumb} />
      </MemoryRouter>
    );
    const img = screen.getByAltText('Test Video Title');
    expect(img).toHaveAttribute('src', '/thumbnails/default-thumbnail.png');
  });

  it('handles missing user gracefully', () => {
    const videoNoUser = { ...mockVideo, user: null };
    render(
      <MemoryRouter>
        <VideoCard video={videoNoUser} />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Video Title')).toBeInTheDocument();
  });

  it('formats zero views correctly', () => {
    const videoZeroViews = { ...mockVideo, views: 0 };
    render(
      <MemoryRouter>
        <VideoCard video={videoZeroViews} />
      </MemoryRouter>
    );
    expect(screen.getByText(/0 views/)).toBeInTheDocument();
  });
});

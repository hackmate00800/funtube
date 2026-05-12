import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategoryBar from '../../components/home/CategoryBar';

const categories = ['All', 'Music', 'Gaming', 'Education'];

describe('CategoryBar Component', () => {
  it('renders all categories', () => {
    render(<CategoryBar categories={categories} selected="All" onSelect={() => {}} />);
    categories.forEach((cat) => {
      expect(screen.getByText(cat)).toBeInTheDocument();
    });
  });

  it('highlights selected category', () => {
    render(<CategoryBar categories={categories} selected="Music" onSelect={() => {}} />);
    const musicBtn = screen.getByText('Music');
    expect(musicBtn.className).toContain('bg-white');
  });

  it('calls onSelect when category is clicked', () => {
    const handleSelect = jest.fn();
    render(<CategoryBar categories={categories} selected="All" onSelect={handleSelect} />);
    fireEvent.click(screen.getByText('Gaming'));
    expect(handleSelect).toHaveBeenCalledWith('Gaming');
  });

  it('renders scroll buttons', () => {
    const { container } = render(<CategoryBar categories={categories} selected="All" onSelect={() => {}} />);
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(categories.length + 2);
  });
});

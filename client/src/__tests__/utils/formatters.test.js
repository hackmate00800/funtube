import { formatViews, formatDuration, truncateText, getInitials, generateColorFromName } from '../../utils/formatters';

describe('formatViews', () => {
  it('formats 0 views', () => expect(formatViews(0)).toBe('0'));
  it('formats 999 views', () => expect(formatViews(999)).toBe('999'));
  it('formats 1000 views', () => expect(formatViews(1000)).toBe('1.0K'));
  it('formats 1500 views', () => expect(formatViews(1500)).toBe('1.5K'));
  it('formats 1000000 views', () => expect(formatViews(1000000)).toBe('1.0M'));
  it('formats 1500000 views', () => expect(formatViews(1500000)).toBe('1.5M'));
  it('handles null', () => expect(formatViews(null)).toBe('0'));
  it('handles undefined', () => expect(formatViews(undefined)).toBe('0'));
});

describe('formatDuration', () => {
  it('formats 0 seconds', () => expect(formatDuration(0)).toBe('0:00'));
  it('formats 65 seconds', () => expect(formatDuration(65)).toBe('1:05'));
  it('formats 3661 seconds', () => expect(formatDuration(3661)).toBe('1:01:01'));
  it('handles null', () => expect(formatDuration(null)).toBe('0:00'));
  it('handles NaN', () => expect(formatDuration(NaN)).toBe('0:00'));
});

describe('truncateText', () => {
  it('returns short text unchanged', () => {
    expect(truncateText('Hello', 100)).toBe('Hello');
  });
  it('truncates long text', () => {
    const result = truncateText('Hello World This Is Long', 10);
    expect(result).toBe('Hello Worl...');
  });
  it('handles null', () => expect(truncateText(null)).toBeNull());
});

describe('getInitials', () => {
  it('returns first letter uppercase', () => expect(getInitials('john')).toBe('J'));
  it('handles empty', () => expect(getInitials('')).toBe('?'));
  it('handles null', () => expect(getInitials(null)).toBe('?'));
});

describe('generateColorFromName', () => {
  it('returns a valid hex color', () => {
    const color = generateColorFromName('test');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('returns default for empty name', () => {
    expect(generateColorFromName('')).toBe('#a21caf');
  });
});

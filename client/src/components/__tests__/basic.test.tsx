import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Basic test', () => {
  it('works', () => {
    expect(true).toBe(true);
  });

  it('renders correctly', () => {
    render(<div>Test</div>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

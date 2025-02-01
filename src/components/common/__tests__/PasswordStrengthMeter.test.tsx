import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Very Weak" for short passwords', () => {
    render(<PasswordStrengthMeter password="weak" />);
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });

  it('shows "Strong" for complex passwords', () => {
    render(<PasswordStrengthMeter password="StrongP@ss123" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('displays password requirements', () => {
    render(<PasswordStrengthMeter password="test" />);
    
    expect(screen.getByText('Password requirements:')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One special character')).toBeInTheDocument();
  });

  it('highlights met requirements in green', () => {
    render(<PasswordStrengthMeter password="TestP@ss123" />);
    
    const requirements = screen.getAllByRole('listitem');
    
    // Check that requirements are met and highlighted
    requirements.forEach(item => {
      expect(item).toHaveClass('text-green-600');
    });
  });

  it('calculates strength correctly for various passwords', () => {
    const { rerender } = render(<PasswordStrengthMeter password="short" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();

    rerender(<PasswordStrengthMeter password="longerpassword" />);
    expect(screen.getByText('Fair')).toBeInTheDocument();

    rerender(<PasswordStrengthMeter password="LongerPassword123" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();

    rerender(<PasswordStrengthMeter password="LongerP@ssword123" />);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });
});

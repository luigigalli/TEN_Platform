import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerification } from '../EmailVerification';
import { useAuth } from '../../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';

// Mock the hooks
jest.mock('../../../hooks/useAuth');
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

describe('EmailVerification', () => {
  const mockVerifyEmail = jest.fn();
  const mockResendVerification = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      verifyEmail: mockVerifyEmail,
      resendVerification: mockResendVerification,
    });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useLocation as jest.Mock).mockReturnValue({
      state: { email: 'test@example.com' },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to signup if no email in state', () => {
    (useLocation as jest.Mock).mockReturnValue({ state: null });
    render(<EmailVerification />);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  it('renders verification form with email', () => {
    render(<EmailVerification />);
    
    expect(screen.getByText('Verify your email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter verification code')).toBeInTheDocument();
  });

  it('handles verification submission', async () => {
    render(<EmailVerification />);
    
    const codeInput = screen.getByPlaceholderText('Enter verification code');
    const submitButton = screen.getByText('Verify Email');

    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('handles verification error', async () => {
    const errorMessage = 'Invalid verification code';
    mockVerifyEmail.mockRejectedValueOnce(new Error(errorMessage));

    render(<EmailVerification />);
    
    const codeInput = screen.getByPlaceholderText('Enter verification code');
    const submitButton = screen.getByText('Verify Email');

    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles resend verification', async () => {
    render(<EmailVerification />);
    
    const resendButton = screen.getByText('Resend code');
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(mockResendVerification).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message and redirects after verification', async () => {
    jest.useFakeTimers();
    mockVerifyEmail.mockResolvedValueOnce({});

    render(<EmailVerification />);
    
    const codeInput = screen.getByPlaceholderText('Enter verification code');
    const submitButton = screen.getByText('Verify Email');

    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email verified successfully!')).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    expect(mockNavigate).toHaveBeenCalledWith('/signin');
    
    jest.useRealTimers();
  });
});

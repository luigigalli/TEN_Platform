import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from '../SignUpForm';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Mock the hooks
jest.mock('../../../hooks/useAuth');
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('SignUpForm', () => {
  const mockSignUp = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ signUp: mockSignUp });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sign-up form', () => {
    render(<SignUpForm />);
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
  });

  it('displays validation errors for empty required fields', async () => {
    render(<SignUpForm />);
    
    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
    });
  });

  it('validates password requirements', async () => {
    render(<SignUpForm />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    await userEvent.type(passwordInput, 'weak');

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
      expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    render(<SignUpForm />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');

    await userEvent.type(passwordInput, 'StrongP@ss123');
    await userEvent.type(confirmPasswordInput, 'DifferentP@ss123');

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    render(<SignUpForm />);
    
    // Fill in the form
    await userEvent.selectOptions(screen.getByRole('combobox'), 'Mr');
    await userEvent.type(screen.getByPlaceholderText('First Name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('MI'), 'A');
    await userEvent.type(screen.getByPlaceholderText('Last Name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john.doe@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'StrongP@ss123');
    await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'StrongP@ss123');
    await userEvent.click(screen.getByRole('checkbox'));

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'StrongP@ss123',
        confirmPassword: 'StrongP@ss123',
        fullName: {
          prefix: 'Mr',
          first: 'John',
          middle: 'A',
          last: 'Doe',
        },
        acceptTerms: true,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email', {
        state: { email: 'john.doe@example.com' },
      });
    });
  });

  it('handles signup error', async () => {
    const errorMessage = 'Email already exists';
    mockSignUp.mockRejectedValueOnce(new Error(errorMessage));

    render(<SignUpForm />);
    
    // Fill in the form with valid data
    await userEvent.type(screen.getByPlaceholderText('First Name'), 'John');
    await userEvent.type(screen.getByPlaceholderText('Last Name'), 'Doe');
    await userEvent.type(screen.getByPlaceholderText('Email address'), 'john.doe@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'StrongP@ss123');
    await userEvent.type(screen.getByPlaceholderText('Confirm Password'), 'StrongP@ss123');
    await userEvent.click(screen.getByRole('checkbox'));

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});

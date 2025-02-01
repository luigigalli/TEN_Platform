import { EmailService } from '../EmailService';
import nodemailer from 'nodemailer';
import { render } from '@react-email/render';

// Mock dependencies
jest.mock('nodemailer');
jest.mock('@react-email/render');

describe('EmailService', () => {
  let emailService: EmailService;
  const mockSendMail = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock nodemailer transport
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    // Mock environment variables
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'password123';
    process.env.SMTP_FROM = 'noreply@ten2.com';

    emailService = new EmailService();
  });

  it('creates nodemailer transport with correct config', () => {
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'password123',
      },
    });
  });

  describe('sendWelcomeEmail', () => {
    it('sends welcome email with correct parameters', async () => {
      const mockHtml = '<div>Welcome Email</div>';
      (render as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({});

      await emailService.sendWelcomeEmail('user@example.com', 'John Doe');

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@ten2.com',
        to: 'user@example.com',
        subject: 'Welcome to TEN2!',
        html: mockHtml,
      });
    });

    it('handles send failure', async () => {
      mockSendMail.mockRejectedValue(new Error('Send failed'));

      await expect(
        emailService.sendWelcomeEmail('user@example.com', 'John Doe')
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendVerificationEmail', () => {
    it('sends verification email with correct parameters', async () => {
      const mockHtml = '<div>Verification Email</div>';
      (render as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({});

      await emailService.sendVerificationEmail('user@example.com', 'John Doe', '123456');

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@ten2.com',
        to: 'user@example.com',
        subject: 'Verify your email address',
        html: mockHtml,
      });
    });

    it('handles send failure', async () => {
      mockSendMail.mockRejectedValue(new Error('Send failed'));

      await expect(
        emailService.sendVerificationEmail('user@example.com', 'John Doe', '123456')
      ).rejects.toThrow('Failed to send email');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('sends password reset email with correct parameters', async () => {
      const mockHtml = '<div>Password Reset Email</div>';
      (render as jest.Mock).mockReturnValue(mockHtml);
      mockSendMail.mockResolvedValue({});

      await emailService.sendPasswordResetEmail(
        'user@example.com',
        'John Doe',
        'https://ten2.com/reset-password?token=abc123'
      );

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@ten2.com',
        to: 'user@example.com',
        subject: 'Reset your password',
        html: mockHtml,
      });
    });

    it('handles send failure', async () => {
      mockSendMail.mockRejectedValue(new Error('Send failed'));

      await expect(
        emailService.sendPasswordResetEmail(
          'user@example.com',
          'John Doe',
          'https://ten2.com/reset-password?token=abc123'
        )
      ).rejects.toThrow('Failed to send email');
    });
  });
});

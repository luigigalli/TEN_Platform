import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { emailService } from '../../services/email.service';
import { db } from '../../db';
import { users } from '../../db/schema';
import { AuthError } from '../../errors/auth.error';

// Mock dependencies
vi.mock('../../services/email.service', () => ({
  emailService: {
    sendEmail: vi.fn(),
  },
}));

vi.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe('AuthService', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    passwordHash: '$2a$10$test',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    permissions: ['read:profile'],
    isVerified: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully log in a verified user', async () => {
      // Mock user query
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      
      // Mock password validation
      vi.spyOn(AuthService as any, 'comparePasswords').mockResolvedValue(true);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw error for unverified user', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Please verify your email before logging in');
    });

    it('should throw error for invalid credentials', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      vi.spyOn(AuthService as any, 'comparePasswords').mockResolvedValue(false);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register a new user', async () => {
      // Mock user not existing
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);
      
      // Mock user creation
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            ...registerData,
            id: '456',
            role: 'USER',
            isVerified: false,
          }]),
        }),
      } as any);

      const result = await AuthService.register(registerData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('verificationToken');
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should throw error for existing email', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);

      await expect(
        AuthService.register(registerData)
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      const token = 'valid-token';
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any);

      const result = await AuthService.verifyEmail(token);

      expect(result).toHaveProperty('message', 'Email verified successfully');
    });

    it('should throw error for invalid token', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);

      await expect(
        AuthService.verifyEmail('invalid-token')
      ).rejects.toThrow('Invalid verification token');
    });
  });

  describe('requestPasswordReset', () => {
    it('should send reset email for existing user', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any);

      const result = await AuthService.requestPasswordReset(mockUser.email);

      expect(result).toHaveProperty('message');
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should not reveal user existence for non-existent email', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);

      const result = await AuthService.requestPasswordReset('nonexistent@example.com');

      expect(result).toHaveProperty('message');
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetToken = 'valid-reset-token';
    const newPassword = 'newpassword123';

    it('should successfully reset password', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      });

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any);

      const result = await AuthService.resetPassword(resetToken, newPassword);

      expect(result).toHaveProperty('message', 'Password reset successfully');
    });

    it('should throw error for expired token', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({
        ...mockUser,
        resetToken,
        resetTokenExpiry: new Date(Date.now() - 3600000), // 1 hour ago
      });

      await expect(
        AuthService.resetPassword(resetToken, newPassword)
      ).rejects.toThrow('Reset token has expired');
    });
  });
});

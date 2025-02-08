import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailService } from '../../services/email.service';
import { emailQueue } from '../../services/email-queue';
import { EmailPreviewService } from '../../services/email-preview';
import { env } from '../../config/environment';

// Mock dependencies
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
    })),
    getTestMessageUrl: vi.fn(),
  },
}));

vi.mock('../../services/email-queue', () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

vi.mock('../../services/email-preview', () => ({
  EmailPreviewService: {
    savePreview: vi.fn(),
  },
}));

describe('EmailService', () => {
  const testEmail = {
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<p>Test content</p>',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should successfully send an email', async () => {
      const result = await emailService.sendEmail(testEmail);
      expect(result).toBeDefined();
      expect(emailQueue.add).toHaveBeenCalledWith(testEmail);
    });

    it('should save preview in development mode', async () => {
      vi.spyOn(env, 'NODE_ENV', 'get').mockReturnValue('development');
      
      await emailService.sendEmail(testEmail);
      
      expect(EmailPreviewService.savePreview).toHaveBeenCalledWith(testEmail);
    });

    it('should not save preview in production mode', async () => {
      vi.spyOn(env, 'NODE_ENV', 'get').mockReturnValue('production');
      
      await emailService.sendEmail(testEmail);
      
      expect(EmailPreviewService.savePreview).not.toHaveBeenCalled();
    });

    it('should handle email sending errors', async () => {
      const error = new Error('SMTP error');
      vi.spyOn(emailQueue, 'add').mockRejectedValue(error);

      await expect(emailService.sendEmail(testEmail)).rejects.toThrow('SMTP error');
    });
  });
});

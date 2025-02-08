import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema';
import notificationPreferencesRouter from '../../routes/notification-preferences';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(),
  },
}));

describe('Notification Preferences', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const mockUser = {
    id: '123',
    notificationPreferences: {
      email: {
        marketing: true,
        security: true,
        updates: true,
        newsletter: true,
      },
      inApp: {
        mentions: true,
        replies: true,
        directMessages: true,
        systemUpdates: true,
      },
    },
  };

  beforeEach(() => {
    mockReq = {
      user: { id: '123' },
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    vi.clearAllMocks();
  });

  describe('GET /notification-preferences', () => {
    it('should return user notification preferences', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser);

      await notificationPreferencesRouter.handle(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser.notificationPreferences);
    });

    it('should handle user not found error', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(null);

      await notificationPreferencesRouter.handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch notification preferences',
      });
    });
  });

  describe('PATCH /notification-preferences', () => {
    const updateData = {
      email: {
        marketing: false,
        security: true,
        updates: true,
        newsletter: false,
      },
      inApp: {
        mentions: true,
        replies: false,
        directMessages: true,
        systemUpdates: true,
      },
    };

    beforeEach(() => {
      mockReq.body = updateData;
    });

    it('should update notification preferences', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              notificationPreferences: updateData,
            }]),
          }),
        }),
      } as any);

      await notificationPreferencesRouter.handle(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(updateData);
    });

    it('should validate preferences format', async () => {
      mockReq.body = {
        email: {
          marketing: 'invalid', // Should be boolean
        },
      };

      await notificationPreferencesRouter.handle(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Invalid notification preferences format',
      }));
    });
  });

  describe('POST /notification-preferences/reset', () => {
    it('should reset preferences to defaults', async () => {
      const defaultPreferences = {
        email: {
          marketing: true,
          security: true,
          updates: true,
          newsletter: true,
        },
        inApp: {
          mentions: true,
          replies: true,
          directMessages: true,
          systemUpdates: true,
        },
      };

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              notificationPreferences: defaultPreferences,
            }]),
          }),
        }),
      } as any);

      await notificationPreferencesRouter.handle(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(defaultPreferences);
    });
  });
});

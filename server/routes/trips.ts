import { Router, type Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../db';
import { trips, tripMembers, users, collaborationSettingsSchema } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @swagger
 * /api/trips/{tripId}/members:
 *   get:
 *     summary: Get trip members
 *     description: Retrieve all members of a trip
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of trip members
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid trip ID
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/:tripId/members', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseInt(req.params.tripId);
    if (isNaN(tripId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid trip ID' });
    }

    // Check if user has access to this trip
    const userMembership = await db.select().from(tripMembers).where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, req.user.id)
      )
    ).limit(1);

    if (!userMembership.length) {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Access denied' });
    }

    const members = await db.select({
      id: tripMembers.id,
      userId: tripMembers.userId,
      role: tripMembers.role,
      status: tripMembers.status,
      joinedAt: tripMembers.joinedAt,
      lastActivity: tripMembers.lastActivity,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role
      }
    })
    .from(tripMembers)
    .leftJoin(users, eq(tripMembers.userId, users.id))
    .where(eq(tripMembers.tripId, tripId));

    return res.json(members);
  } catch (error) {
    console.error('Error fetching trip members:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to fetch trip members' });
  }
});

/**
 * @swagger
 * /api/trips/{tripId}/members:
 *   post:
 *     summary: Add member to trip
 *     description: Add a new member to a trip
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               role:
 *                 type: string
 *                 enum: [member, admin]
 *     responses:
 *       201:
 *         description: Member added successfully
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid trip ID or request body
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       409:
 *         description: User is already a member of this trip
 *       500:
 *         description: Server error
 */
router.post('/:tripId/members', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseInt(req.params.tripId);
    if (isNaN(tripId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid trip ID' });
    }

    const schema = z.object({
      userId: z.number(),
      role: z.enum(['member', 'admin']).default('member')
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: result.error });
    }

    const { userId, role } = result.data;

    // Check if user has admin access to this trip
    const userMembership = await db.select().from(tripMembers).where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, req.user.id)
      )
    ).limit(1);

    if (!userMembership.length || userMembership[0].role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Access denied' });
    }

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await db.select().from(tripMembers).where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, userId)
      )
    ).limit(1);

    if (existingMember.length) {
      return res.status(StatusCodes.CONFLICT).json({ error: 'User is already a member of this trip' });
    }

    // Add user to trip
    const newMember = await db.insert(tripMembers).values({
      tripId,
      userId,
      role,
      status: 'active'
    }).returning();

    return res.status(StatusCodes.CREATED).json(newMember[0]);
  } catch (error) {
    console.error('Error adding trip member:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to add trip member' });
  }
});

/**
 * @swagger
 * /api/trips/{tripId}/settings:
 *   patch:
 *     summary: Update trip settings
 *     description: Update collaboration settings for a trip
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collaborationSettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Invalid trip ID or request body
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.patch('/:tripId/settings', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tripId = parseInt(req.params.tripId);
    if (isNaN(tripId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid trip ID' });
    }

    // Check if user has admin access to this trip
    const userMembership = await db.select().from(tripMembers).where(
      and(
        eq(tripMembers.tripId, tripId),
        eq(tripMembers.userId, req.user.id)
      )
    ).limit(1);

    if (!userMembership.length || userMembership[0].role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({ error: 'Access denied' });
    }

    const result = collaborationSettingsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: result.error });
    }

    const updatedTrip = await db.update(trips)
      .set({ collaborationSettings: result.data })
      .where(eq(trips.id, tripId))
      .returning();

    return res.json(updatedTrip[0]);
  } catch (error) {
    console.error('Error updating trip settings:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update trip settings' });
  }
});

export default router;

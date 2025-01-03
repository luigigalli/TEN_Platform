import { Router } from 'express';
import { performHealthCheck } from '../config/deployment-validator';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get system health status
 *     description: Returns the health status of all system components including database, server, and environment configurations
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy]
 *                   description: The health status of the system
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: The time when the health check was performed
 *                 environment:
 *                   type: string
 *                   enum: [development, production, test]
 *                   description: Current environment
 *                 platform:
 *                   type: string
 *                   enum: [Replit, Windsurf/Local]
 *                   description: Current platform
 *             example:
 *               status: healthy
 *               timestamp: "2025-01-03T12:00:00.000Z"
 *               environment: development
 *               platform: Replit
 *       500:
 *         description: System health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               message: System health check failed
 *               timestamp: "2025-01-03T12:00:00.000Z"
 */
router.get('/', async (_req, res) => {
  try {
    const isHealthy = await performHealthCheck();

    if (!isHealthy) {
      return res.status(500).json({
        status: 'error',
        message: 'System health check failed',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.env.REPL_ID ? 'Replit' : 'Windsurf/Local'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export const healthRoutes = router;
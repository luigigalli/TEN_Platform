import { Router } from 'express';
import { performHealthCheck } from '../config/deployment-validator';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Get system health status
 *     description: Returns the health status of all system components
 *     responses:
 *       200:
 *         description: System is healthy
 *       500:
 *         description: System health check failed
 */
router.get('/', async (_req, res) => {
  try {
    const isHealthy = await performHealthCheck();
    
    if (!isHealthy) {
      return res.status(500).json({
        status: 'error',
        message: 'System health check failed'
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

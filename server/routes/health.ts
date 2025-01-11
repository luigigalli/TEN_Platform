import { Router, type Express } from 'express';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get system health status
 *     description: Returns the health status of the system
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
 *                   enum: [ok]
 *                   description: The health status of the system
 *             example:
 *               status: ok
 */
router.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

export function setupHealthRoutes(app: Express): void {
  app.use('/api/health', router);
}
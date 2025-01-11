import { Router } from 'express';
import { db } from "@db";
import { services } from "@db/schema";
import { requireAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

export const serviceRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Service management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceType:
 *       type: string
 *       enum: [experience, insurance, accommodation, transport]
 *       description: Type of service offered
 */

/**
 * @swagger
 * /api/services:
 *   get:
 *     summary: List all services
 *     description: Retrieve a list of services with optional filtering
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/ServiceType'
 *         description: Filter by service type
 *     responses:
 *       200:
 *         description: List of services
 */
serviceRoutes.get('/', async (req, res) => {
  try {
    // Implementation will support filtering by type
    const services = await db.select().from(services);
    res.json(services);
  } catch (error) {
    console.error('Services fetch error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/services/{id}:
 *   get:
 *     summary: Get service details
 *     description: Retrieve detailed information about a specific service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
 */
serviceRoutes.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid service ID" });
    }

    const service = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!service.length) {
      return res.status(404).json({ error: "Service not found" });
    }

    res.json(service[0]);
  } catch (error) {
    console.error('Service fetch error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/services:
 *   post:
 *     summary: Create a new service
 *     description: Create a new service with the provided details
 *     tags: [Services]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 $ref: '#/components/schemas/ServiceType'
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service created successfully
 *       401:
 *         description: Not authenticated
 */
serviceRoutes.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Implementation will validate and create new service
    res.status(201).json({ message: "Service created successfully" });
  } catch (error) {
    console.error('Service creation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

import { Request, Response } from "express";
import { z } from "zod";
import { services } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Express } from "express";
import { db } from "../db";
import { requireAuth } from "./auth";

// Validation schemas
const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  location: z.string().min(1, "Location is required"),
  providerId: z.number().int().positive("Provider ID is required"),
});

export function setupServicesRoutes(app: Express) {
  // Get all services
  app.get("/api/services", async (_req: Request, res: Response) => {
    try {
      const allServices = await db.select().from(services);
      res.json(allServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({
        message: "Failed to fetch services",
        code: "fetch_error",
      });
    }
  });

  // Get service by ID
  app.get("/api/services/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          message: "Invalid service ID",
          code: "invalid_id",
        });
      }

      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, id))
        .limit(1);

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
          code: "not_found",
        });
      }

      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({
        message: "Failed to fetch service",
        code: "fetch_error",
      });
    }
  });

  // Create new service (requires authentication)
  app.post("/api/services", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = createServiceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: result.error.issues.map((i) => i.message).join(", "),
          code: "validation_error",
        });
      }

      const [newService] = await db
        .insert(services)
        .values(result.data)
        .returning();

      res.status(201).json({
        message: "Service created successfully",
        service: newService,
      });
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({
        message: "Failed to create service",
        code: "create_error",
      });
    }
  });

  // Update service (requires authentication)
  app.put("/api/services/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          message: "Invalid service ID",
          code: "invalid_id",
        });
      }

      const result = createServiceSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: result.error.issues.map((i) => i.message).join(", "),
          code: "validation_error",
        });
      }

      const [updatedService] = await db
        .update(services)
        .set(result.data)
        .where(eq(services.id, id))
        .returning();

      if (!updatedService) {
        return res.status(404).json({
          message: "Service not found",
          code: "not_found",
        });
      }

      res.json({
        message: "Service updated successfully",
        service: updatedService,
      });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({
        message: "Failed to update service",
        code: "update_error",
      });
    }
  });

  // Delete service (requires authentication)
  app.delete("/api/services/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          message: "Invalid service ID",
          code: "invalid_id",
        });
      }

      const [deletedService] = await db
        .delete(services)
        .where(eq(services.id, id))
        .returning();

      if (!deletedService) {
        return res.status(404).json({
          message: "Service not found",
          code: "not_found",
        });
      }

      res.json({
        message: "Service deleted successfully",
        service: deletedService,
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({
        message: "Failed to delete service",
        code: "delete_error",
      });
    }
  });
}

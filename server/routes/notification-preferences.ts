import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { AuthError } from "../errors/auth.error";
import { authenticate } from "../middleware/auth";

const router = Router();

const updatePreferencesSchema = z.object({
  email: z.object({
    marketing: z.boolean(),
    security: z.boolean(),
    updates: z.boolean(),
    newsletter: z.boolean(),
  }),
  inApp: z.object({
    mentions: z.boolean(),
    replies: z.boolean(),
    directMessages: z.boolean(),
    systemUpdates: z.boolean(),
  }),
});

// Get user's notification preferences
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        notificationPreferences: true,
      },
    });

    if (!user) {
      throw new AuthError("User not found");
    }

    res.json(user.notificationPreferences);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch notification preferences",
    });
  }
});

// Update user's notification preferences
router.patch("/", authenticate, async (req, res) => {
  try {
    const preferences = updatePreferencesSchema.parse(req.body);

    const [user] = await db
      .update(users)
      .set({
        notificationPreferences: preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id))
      .returning({ notificationPreferences: true });

    res.json(user.notificationPreferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Invalid notification preferences format",
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      error: "Failed to update notification preferences",
    });
  }
});

// Reset notification preferences to defaults
router.post("/reset", authenticate, async (req, res) => {
  try {
    const [user] = await db
      .update(users)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id))
      .returning({ notificationPreferences: true });

    res.json(user.notificationPreferences);
  } catch (error) {
    res.status(500).json({
      error: "Failed to reset notification preferences",
    });
  }
});

export default router;

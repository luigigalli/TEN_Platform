import { Request, Response } from "express";
import { z } from "zod";
import { messages } from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { Express } from "express";
import { db } from "../db";
import { requireAuth } from "./auth";

// Validation schemas
const messageTypeSchema = z.enum([
  'expert_inquiry',
  'trip_discussion',
  'booking_support',
  'admin_notice'
]);

const contextTypeSchema = z.enum([
  'trip',
  'booking',
  'service'
]);

const createMessageSchema = z.object({
  receiverId: z.number().int().positive(),
  message: z.string().min(1),
  messageType: messageTypeSchema,
  contextId: z.number().int().positive().optional(),
  contextType: contextTypeSchema.optional(),
  conversationId: z.string().min(1),
});

export function setupMessagesRoutes(app: Express) {
  // Get messages for a conversation or all user's messages
  app.get("/api/messages/:conversationId?", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
          code: "auth_required",
        });
      }

      let query = db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        );

      if (conversationId) {
        query = query.where(eq(messages.conversationId, conversationId));
      }

      const userMessages = await query.orderBy(messages.createdAt);

      res.json(userMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        message: "Failed to fetch messages",
        code: "fetch_error",
      });
    }
  });

  // Send a message
  app.post("/api/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const validatedData = createMessageSchema.parse(req.body);

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
          code: "auth_required",
        });
      }

      // Create message
      const [message] = await db.insert(messages).values({
        senderId: userId,
        receiverId: validatedData.receiverId,
        message: validatedData.message,
        messageType: validatedData.messageType,
        contextId: validatedData.contextId,
        contextType: validatedData.contextType,
        conversationId: validatedData.conversationId,
        status: "sent",
      }).returning();

      res.json({
        message,
        conversationId: validatedData.conversationId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid message data",
          code: "validation_error",
          details: error.errors,
        });
      }
      res.status(500).json({
        message: "Failed to send message",
        code: "send_error",
      });
    }
  });

  // Mark message as read
  app.post("/api/messages/:messageId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const messageId = parseInt(req.params.messageId);

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
          code: "auth_required",
        });
      }

      // Verify message exists and belongs to user
      const [message] = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.id, messageId),
            eq(messages.receiverId, userId)
          )
        )
        .limit(1);

      if (!message) {
        return res.status(404).json({
          message: "Message not found",
          code: "not_found",
        });
      }

      // Update message status
      const [updatedMessage] = await db
        .update(messages)
        .set({ status: "read" })
        .where(eq(messages.id, messageId))
        .returning();

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({
        message: "Failed to mark message as read",
        code: "update_error",
      });
    }
  });
}

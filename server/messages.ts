import { Request, Response } from "express";
import { z } from "zod";
import { messages } from "../db/schema";
import { eq, and, or } from "drizzle-orm";
import type { Express } from "express";
import { db } from "../db";
import { requireAuth } from "./auth";
import { EnvironmentValidationError } from "./errors/environment";

// Enhanced validation schemas with user-friendly messages
const messageTypeSchema = z.enum([
  'expert_inquiry',
  'trip_discussion',
  'booking_support',
  'admin_notice'
], {
  errorMap: () => ({ message: "Please select a valid message type" })
});

const contextTypeSchema = z.enum([
  'trip',
  'booking',
  'service'
], {
  errorMap: () => ({ message: "Please select a valid context type" })
});

const createMessageSchema = z.object({
  receiverId: z.number().int().positive("Please select a valid recipient"),
  message: z.string().min(1, "Message cannot be empty")
    .max(2000, "Message cannot exceed 2000 characters"),
  messageType: messageTypeSchema,
  contextId: z.number().int().positive("Please select a valid context").optional(),
  contextType: contextTypeSchema.optional(),
  conversationId: z.string().min(1, "Conversation ID is required"),
});

export function setupMessagesRoutes(app: Express) {
  // Get messages with enhanced error handling
  app.get("/api/messages/:conversationId?", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;

      if (!userId) {
        throw new EnvironmentValidationError("User authentication required", {
          userMessage: "Please log in to access messages",
          path: "authentication"
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
      if (error instanceof EnvironmentValidationError) {
        return res.status(error.status).json({
          message: error.message,
          code: error.code,
          details: error.details
        });
      }
      res.status(500).json({
        message: "Unable to fetch messages at this time",
        code: "fetch_error",
        details: {
          userMessage: "Please try again later",
          troubleshooting: ["Check your internet connection", "Refresh the page"]
        }
      });
    }
  });

  // Send a message
  app.post("/api/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const validatedData = createMessageSchema.parse(req.body);

      if (!userId) {
        throw new EnvironmentValidationError("User authentication required", {
          userMessage: "Please log in to send a message",
          path: "authentication"
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
      if (error instanceof EnvironmentValidationError) {
        return res.status(error.status).json({
          message: error.message,
          code: error.code,
          details: error.details
        });
      }
      res.status(500).json({
        message: "Unable to send message at this time",
        code: "send_error",
        details: {
          userMessage: "Please try again later",
          troubleshooting: ["Check your internet connection", "Refresh the page"]
        }
      });
    }
  });

  // Mark message as read
  app.post("/api/messages/:messageId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const messageId = parseInt(req.params.messageId);

      if (!userId) {
        throw new EnvironmentValidationError("User authentication required", {
          userMessage: "Please log in to mark message as read",
          path: "authentication"
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
      if (error instanceof EnvironmentValidationError) {
        return res.status(error.status).json({
          message: error.message,
          code: error.code,
          details: error.details
        });
      }
      res.status(500).json({
        message: "Unable to mark message as read at this time",
        code: "update_error",
        details: {
          userMessage: "Please try again later",
          troubleshooting: ["Check your internet connection", "Refresh the page"]
        }
      });
    }
  });
}
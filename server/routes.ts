import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { 
  users, 
  trips, 
  posts, 
  services, 
  bookings, 
  messages,
  insertTripSchema, 
  insertBookingSchema, 
  insertServiceSchema,
  insertMessageSchema,
  type Trip,
  type Message,
  type InsertMessage
} from "@db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { createPaymentIntent, confirmPayment } from "./payment";

export function registerRoutes(app: Express): Server {
  // Authentication logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      if (req.method === 'POST') {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
      }
    }
    next();
  });

  setupAuth(app);

  // Messages endpoints
  app.get("/api/messages/:conversationId?", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { conversationId } = req.params;
      const userId = (req.user as any).id;

      const userMessages = await db
        .select()
        .from(messages)
        .where(
          conversationId
            ? eq(messages.conversationId, conversationId)
            : or(
                eq(messages.senderId, userId),
                eq(messages.receiverId, userId)
              )
        )
        .orderBy(desc(messages.createdAt));

      res.json(userMessages);
    } catch (error: any) {
      console.error('Messages fetch error:', error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      console.log('Processing message:', req.body);
      const messageData: Partial<InsertMessage> = {
        ...req.body,
        senderId: (req.user as any).id,
        status: 'unread',
      };

      const result = insertMessageSchema.safeParse(messageData);

      if (!result.success) {
        console.error('Message validation error:', result.error);
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        );
      }

      const [message] = await db
        .insert(messages)
        .values(result.data)
        .returning();

      console.log('Message created successfully:', message);
      res.json(message);
    } catch (error: any) {
      console.error('Message creation error:', error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/messages/:messageId/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { messageId } = req.params;
      const userId = (req.user as any).id;

      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, parseInt(messageId)))
        .limit(1);

      if (!message) {
        return res.status(404).send("Message not found");
      }

      if (message.receiverId !== userId) {
        return res.status(403).send("Not authorized to mark this message as read");
      }

      const [updatedMessage] = await db
        .update(messages)
        .set({ status: "read" })
        .where(eq(messages.id, parseInt(messageId)))
        .returning();

      res.json(updatedMessage);
    } catch (error: any) {
      console.error('Message status update error:', error);
      res.status(500).send(error.message);
    }
  });

  // Services endpoints
  app.get("/api/services", async (_req, res) => {
    try {
      const allServices = await db.select().from(services);
      res.json(allServices);
    } catch (error: any) {
      console.error('Services fetch error:', error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/services", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const result = insertServiceSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        );
      }

      const [service] = await db
        .insert(services)
        .values({
          ...result.data,
          providerId: (req.user as any).id,
        })
        .returning();

      res.json(service);
    } catch (error: any) {
      console.error('Service creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Bookings endpoints
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      console.log('Processing booking request:', req.body);
      const result = insertBookingSchema.safeParse(req.body);

      if (!result.success) {
        console.error('Booking validation error:', result.error);
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        );
      }

      // Create booking with pending_payment status
      const [booking] = await db
        .insert(bookings)
        .values({
          startDate: new Date(result.data.startDate),
          endDate: result.data.endDate ? new Date(result.data.endDate) : null,
          totalPrice: result.data.totalPrice.toString(),
          status: "pending_payment",
          notes: result.data.notes,
          serviceId: result.data.serviceId,
          userId: (req.user as any).id,
        })
        .returning();

      console.log('Booking created successfully:', booking);

      // Create payment intent
      const paymentIntent = await createPaymentIntent(booking.id);

      res.json({
        booking,
        clientSecret: paymentIntent.client_secret
      });
    } catch (error: any) {
      console.error('Booking creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Payment endpoints
  app.post("/api/payments/confirm", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { bookingId, paymentIntentId } = req.body;
      if (!bookingId || !paymentIntentId) {
        return res.status(400).send("Missing bookingId or paymentIntentId");
      }

      const result = await confirmPayment(bookingId, paymentIntentId);
      res.json(result);
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Trips endpoints
  app.get("/api/trips", async (_req, res) => {
    try {
      const userTrips = await db.select().from(trips);
      res.json(userTrips);
    } catch (error: any) {
      console.error('Trips fetch error:', error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const result = insertTripSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        );
      }

      const tripData: Omit<Trip, 'id' | 'createdAt'> = {
        ...result.data,
        userId: (req.user as any).id,
        members: [],
        itinerary: [],
      };

      const [trip] = await db
        .insert(trips)
        .values(tripData)
        .returning();

      res.json(trip);
    } catch (error: any) {
      console.error('Trip creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Posts endpoints
  app.get("/api/posts", async (_req, res) => {
    try {
      const userPosts = await db.select().from(posts);
      res.json(userPosts);
    } catch (error: any) {
      console.error('Posts fetch error:', error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [post] = await db
        .insert(posts)
        .values({
          ...req.body,
          userId: (req.user as any).id,
        })
        .returning();

      res.json(post);
    } catch (error: any) {
      console.error('Post creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Add users endpoint for profile viewing
  app.get("/api/users", async (_req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers.map(user => ({
        ...user,
        password: undefined
      })));
    } catch (error: any) {
      console.error('Users fetch error:', error);
      res.status(500).send(error.message);
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
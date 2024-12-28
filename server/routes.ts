import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { trips, posts, services, bookings, insertTripSchema, insertBookingSchema, insertServiceSchema } from "@db/schema";
import { eq } from "drizzle-orm";

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

      const service = await db
        .insert(services)
        .values({
          ...result.data,
          providerId: (req.user as any).id,
        })
        .returning();

      res.json(service[0]);
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

      const booking = await db
        .insert(bookings)
        .values({
          ...result.data,
          userId: (req.user as any).id,
        })
        .returning();

      console.log('Booking created successfully:', booking[0]);
      res.json(booking[0]);
    } catch (error: any) {
      console.error('Booking creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Trips endpoints
  app.get("/api/trips", async (req, res) => {
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

      const trip = await db
        .insert(trips)
        .values({
          ...result.data,
          userId: (req.user as any).id,
        })
        .returning();

      res.json(trip[0]);
    } catch (error: any) {
      console.error('Trip creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
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
      const post = await db
        .insert(posts)
        .values({
          ...req.body,
          userId: (req.user as any).id,
        })
        .returning();

      res.json(post[0]);
    } catch (error: any) {
      console.error('Post creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Expert contact endpoint
  app.post("/api/experts/contact", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { expertId, message } = req.body;
      // In a real application, this would send an email or create a chat thread
      // For now, we'll just return a success message
      res.json({ success: true, message: "Contact request sent successfully" });
    } catch (error: any) {
      console.error('Expert contact error:', error);
      res.status(500).send(error.message);
    }
  });

  // Add users endpoint for profile viewing
  app.get("/api/users", async (req, res) => {
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
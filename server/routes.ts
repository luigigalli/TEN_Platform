import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { trips, posts } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Trips endpoints
  app.get("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userTrips = await db.select().from(trips);
    res.json(userTrips);
  });

  app.post("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const trip = await db
      .insert(trips)
      .values({
        ...req.body,
        userId: req.user!.id,
      })
      .returning();

    res.json(trip[0]);
  });

  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const userPosts = await db.select().from(posts);
    res.json(userPosts);
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const post = await db
      .insert(posts)
      .values({
        ...req.body,
        userId: req.user!.id,
      })
      .returning();

    res.json(post[0]);
  });

  const httpServer = createServer(app);

  return httpServer;
}

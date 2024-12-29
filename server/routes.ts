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
  tripMembers,
  tripActivities,
  insertTripSchema, 
  insertBookingSchema, 
  insertServiceSchema,
  insertMessageSchema,
  insertTripMemberSchema,
  insertTripActivitySchema,
  type Trip,
  type Message,
  type InsertMessage
} from "@db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { createPaymentIntent, confirmPayment } from "./payment";
import { parseISO, isValid, format } from "date-fns";

// Custom type for request with authenticated user
interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  isAuthenticated(): boolean;
}

// Helper functions for date handling
function parseDate(dateString: string | Date | null): Date | null {
  if (!dateString) return null;
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Date parsing error:', error);
    return null;
  }
}

function formatDate(date: Date | string | null): string | null {
  if (!date) return null;
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsedDate) ? format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null;
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
}

export function registerRoutes(app: Express): Server {
  // Set up authentication first, before any other routes
  setupAuth(app);

  // Authentication logging middleware with proper date handling
  app.use((req: AuthenticatedRequest, res, next) => {
    if (req.path.startsWith('/api/')) {
      const timestamp = formatDate(new Date()) ?? new Date().toISOString();
      console.log(`${timestamp} - ${req.method} ${req.path} - User: ${req.user?.username || 'anonymous'}`);
      if (req.method === 'POST') {
        console.log('Request body:', req.body ? JSON.stringify(req.body, null, 2) : 'No body');
      }
    }
    next();
  });

  // Trip collaboration endpoints
  app.get("/api/trips/:tripId/members", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const tripId = parseInt(req.params.tripId);
      if (isNaN(tripId)) {
        return res.status(400).json({ error: "Invalid trip ID" });
      }

      const members = await db
        .select()
        .from(tripMembers)
        .where(eq(tripMembers.tripId, tripId))
        .orderBy(desc(tripMembers.joinedAt));

      // Format dates in the response
      const formattedMembers = members.map(member => ({
        ...member,
        joinedAt: formatDate(member.joinedAt),
        updatedAt: formatDate(member.updatedAt),
      }));

      res.json(formattedMembers);
    } catch (error) {
      console.error('Trip members fetch error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  app.post("/api/trips/:tripId/members", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const tripId = parseInt(req.params.tripId);
      if (isNaN(tripId)) {
        return res.status(400).json({ error: "Invalid trip ID" });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if the user has permission to invite
      const [trip] = await db
        .select()
        .from(trips)
        .where(eq(trips.id, tripId))
        .limit(1);

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const isOwner = trip.userId === req.user?.id;
      if (!isOwner && !trip.collaborationSettings?.canInvite) {
        return res.status(403).json({ error: "You don't have permission to invite members" });
      }

      // Find user by email
      const [invitedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!invitedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user is already a member
      const [existingMember] = await db
        .select()
        .from(tripMembers)
        .where(
          and(
            eq(tripMembers.tripId, tripId),
            eq(tripMembers.userId, invitedUser.id)
          )
        )
        .limit(1);

      if (existingMember) {
        return res.status(400).json({ error: "User is already a member of this trip" });
      }

      // Create trip member with proper date handling
      const now = new Date();
      const result = insertTripMemberSchema.safeParse({
        tripId,
        userId: invitedUser.id,
        role: "member",
        status: "pending",
        joinedAt: formatDate(now),
        updatedAt: formatDate(now),
      });

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        });
      }

      const [member] = await db
        .insert(tripMembers)
        .values(result.data)
        .returning();

      // Create activity with proper date handling
      await db.insert(tripActivities).values({
        tripId,
        createdBy: req.user?.id,
        type: "member_invited",
        content: `invited ${invitedUser.username} to join the trip`,
        createdAt: formatDate(now),
      });

      // Format dates in the response
      const formattedMember = {
        ...member,
        joinedAt: formatDate(member.joinedAt),
        updatedAt: formatDate(member.updatedAt),
      };

      res.json(formattedMember);
    } catch (error) {
      console.error('Trip member creation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  app.patch("/api/trips/:tripId/settings", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const tripId = parseInt(req.params.tripId);
      if (isNaN(tripId)) {
        return res.status(400).json({ error: "Invalid trip ID" });
      }

      const { collaborationSettings } = req.body;
      if (!collaborationSettings) {
        return res.status(400).json({ error: "Collaboration settings are required" });
      }

      // Verify ownership
      const [trip] = await db
        .select()
        .from(trips)
        .where(eq(trips.id, tripId))
        .limit(1);

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      if (trip.userId !== req.user?.id) {
        return res.status(403).json({ error: "Only the trip owner can modify settings" });
      }

      // Update settings with proper date handling
      const now = new Date();
      const [updatedTrip] = await db
        .update(trips)
        .set({ 
          collaborationSettings,
          updatedAt: formatDate(now),
        })
        .where(eq(trips.id, tripId))
        .returning();

      // Create activity with proper date handling
      await db.insert(tripActivities).values({
        tripId,
        createdBy: req.user?.id,
        type: "settings_updated",
        content: "updated trip collaboration settings",
        createdAt: formatDate(now),
      });

      // Format dates in the response
      const formattedTrip = {
        ...updatedTrip,
        createdAt: formatDate(updatedTrip.createdAt),
        updatedAt: formatDate(updatedTrip.updatedAt),
        startDate: formatDate(updatedTrip.startDate),
        endDate: formatDate(updatedTrip.endDate),
      };

      res.json(formattedTrip);
    } catch (error) {
      console.error('Trip settings update error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  // Trip listing endpoint with proper date handling
  app.get("/api/trips", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      console.log('Fetching trips for user:', userId);

      // First get all trips where user is the owner
      const ownedTrips = await db
        .select()
        .from(trips)
        .where(eq(trips.userId, userId));

      // Then get trips where user is a member
      const memberTrips = await db
        .select({
          trip: trips,
          memberStatus: tripMembers.status
        })
        .from(trips)
        .innerJoin(
          tripMembers,
          and(
            eq(trips.id, tripMembers.tripId),
            eq(tripMembers.userId, userId),
            eq(tripMembers.status, "accepted")
          )
        );

      // Combine and deduplicate trips
      const combinedTrips = [
        ...ownedTrips,
        ...memberTrips.map(({ trip }) => trip)
      ];

      // Remove duplicates based on trip ID
      const uniqueTrips = Array.from(
        new Map(combinedTrips.map(trip => [trip.id, trip])).values()
      );

      // Sort by created date with proper date handling
      const sortedTrips = uniqueTrips.sort((a, b) => {
        const dateA = parseDate(a.createdAt);
        const dateB = parseDate(b.createdAt);
        return dateB && dateA ? dateB.getTime() - dateA.getTime() : 0;
      });

      // Format dates in the response
      const formattedTrips = sortedTrips.map(trip => ({
        ...trip,
        createdAt: formatDate(trip.createdAt),
        updatedAt: formatDate(trip.updatedAt),
        startDate: formatDate(trip.startDate),
        endDate: formatDate(trip.endDate),
      }));

      console.log('Returning trips:', formattedTrips.length);
      res.json(formattedTrips);
    } catch (error) {
      console.error('Trips fetch error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  // Trip creation endpoint with proper date handling
  app.post("/api/trips", async (req: AuthenticatedRequest, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const now = new Date();
      const result = insertTripSchema.safeParse({
        ...req.body,
        userId: req.user?.id,
        collaborationSettings: {
          canInvite: false,
          canEdit: false,
          canComment: true
        },
        createdAt: formatDate(now),
        updatedAt: formatDate(now),
        startDate: req.body.startDate ? formatDate(parseDate(req.body.startDate)) : null,
        endDate: req.body.endDate ? formatDate(parseDate(req.body.endDate)) : null,
      });

      if (!result.success) {
        return res.status(400).json({
          error: "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        });
      }

      const [trip] = await db
        .insert(trips)
        .values(result.data)
        .returning();

      // Create initial activity with proper date handling
      await db.insert(tripActivities).values({
        tripId: trip.id,
        createdBy: req.user?.id,
        type: "trip_created",
        content: "created the trip",
        createdAt: formatDate(now),
      });

      // Format dates in the response
      const formattedTrip = {
        ...trip,
        createdAt: formatDate(trip.createdAt),
        updatedAt: formatDate(trip.updatedAt),
        startDate: formatDate(trip.startDate),
        endDate: formatDate(trip.endDate),
      };

      res.json(formattedTrip);
    } catch (error) {
      console.error('Trip creation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  // Create HTTP server
  const server = createServer(app);
  return server;
}
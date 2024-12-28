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

export function registerRoutes(app: Express): Server {
  // Set up authentication first, before any other routes
  setupAuth(app);

  // Authentication logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.user?.username || 'anonymous'}`);
      if (req.method === 'POST') {
        console.log('Request body:', req.body ? JSON.stringify(req.body, null, 2) : 'No body');
      }
    }
    next();
  });

  // Trip collaboration endpoints
  app.get("/api/trips/:tripId/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const tripId = parseInt(req.params.tripId);
      const members = await db
        .select()
        .from(tripMembers)
        .where(eq(tripMembers.tripId, tripId))
        .orderBy(desc(tripMembers.joinedAt));

      res.json(members);
    } catch (error: any) {
      console.error('Trip members fetch error:', error);
      res.status(500).send(error.message);
    }
  });

  app.post("/api/trips/:tripId/members", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const tripId = parseInt(req.params.tripId);
      const { email } = req.body;

      // Check if the user has permission to invite
      const [trip] = await db
        .select()
        .from(trips)
        .where(eq(trips.id, tripId))
        .limit(1);

      if (!trip) {
        return res.status(404).send("Trip not found");
      }

      const isOwner = trip.userId === (req.user as any).id;
      if (!isOwner && !trip.collaborationSettings.canInvite) {
        return res.status(403).send("You don't have permission to invite members");
      }

      // Find user by email
      const [invitedUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!invitedUser) {
        return res.status(404).send("User not found");
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
        return res.status(400).send("User is already a member of this trip");
      }

      // Create trip member
      const result = insertTripMemberSchema.safeParse({
        tripId,
        userId: invitedUser.id,
        role: "member",
        status: "pending"
      });

      if (!result.success) {
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        );
      }

      const [member] = await db
        .insert(tripMembers)
        .values(result.data)
        .returning();

      // Create activity
      await db.insert(tripActivities).values({
        tripId,
        createdBy: (req.user as any).id,
        type: "member_invited",
        content: `invited ${invitedUser.username} to join the trip`
      });

      res.json(member);
    } catch (error: any) {
      console.error('Trip member creation error:', error);
      res.status(500).send(error.message);
    }
  });

  app.patch("/api/trips/:tripId/settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const tripId = parseInt(req.params.tripId);
      const { collaborationSettings } = req.body;

      // Verify ownership
      const [trip] = await db
        .select()
        .from(trips)
        .where(eq(trips.id, tripId))
        .limit(1);

      if (!trip) {
        return res.status(404).send("Trip not found");
      }

      if (trip.userId !== (req.user as any).id) {
        return res.status(403).send("Only the trip owner can modify settings");
      }

      // Update settings
      const [updatedTrip] = await db
        .update(trips)
        .set({ collaborationSettings })
        .where(eq(trips.id, tripId))
        .returning();

      // Create activity
      await db.insert(tripActivities).values({
        tripId,
        createdBy: (req.user as any).id,
        type: "settings_updated",
        content: "updated trip collaboration settings"
      });

      res.json(updatedTrip);
    } catch (error: any) {
      console.error('Trip settings update error:', error);
      res.status(500).send(error.message);
    }
  });

  // Trip listing endpoint
  app.get("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userId = (req.user as any).id;
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

      // Sort by created date
      const sortedTrips = uniqueTrips.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log('Returning trips:', sortedTrips.length);
      res.json(sortedTrips);
    } catch (error: any) {
      console.error('Trips fetch error:', error);
      res.status(500).send(error.message);
    }
  });

  // Trip creation endpoint
  app.post("/api/trips", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const result = insertTripSchema.safeParse({
        ...req.body,
        userId: (req.user as any).id,
        collaborationSettings: {
          canInvite: false,
          canEdit: false,
          canComment: true
        }
      });

      if (!result.success) {
        return res.status(400).send(
          "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
        );
      }

      const [trip] = await db
        .insert(trips)
        .values(result.data)
        .returning();

      // Create initial activity
      await db.insert(tripActivities).values({
        tripId: trip.id,
        createdBy: (req.user as any).id,
        type: "trip_created",
        content: "created the trip"
      });

      res.json(trip);
    } catch (error: any) {
      console.error('Trip creation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Messages endpoints with proper type handling
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      console.log('Processing message:', req.body);
      const messageData = {
        ...req.body,
        senderId: (req.user as any).id,
        status: 'unread' as const,
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



  app.get("/api/trips/:tripId/activities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const tripId = parseInt(req.params.tripId);
      const activities = await db
        .select()
        .from(tripActivities)
        .where(eq(tripActivities.tripId, tripId))
        .orderBy(desc(tripActivities.createdAt));

      res.json(activities);
    } catch (error: any) {
      console.error('Trip activities fetch error:', error);
      res.status(500).send(error.message);
    }
  });

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
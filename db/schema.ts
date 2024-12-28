import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Add collaboration settings type
export const collaborationSettingsSchema = z.object({
  canInvite: z.boolean(),
  canEdit: z.boolean(),
  canComment: z.boolean()
});

export type CollaborationSettings = z.infer<typeof collaborationSettingsSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  role: text("role").notNull().default("user"),
  fullName: text("full_name"),
  bio: text("bio"),
  avatar: text("avatar"),
  languages: json("languages").default([]),
  createdAt: timestamp("created_at").defaultNow()
});

// Create a more robust validation schema for user registration
export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["user", "expert", "provider", "admin"]).default("user"),
  fullName: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  languages: z.array(z.string()).optional()
});

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price").notNull(),
  location: text("location").notNull(),
  providerId: integer("provider_id").references(() => users.id),
  category: text("category").notNull(),
  images: json("images").default([]),
  availability: json("availability").default([]),
  createdAt: timestamp("created_at").defaultNow()
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  serviceId: integer("service_id").references(() => services.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("pending"),
  totalPrice: decimal("total_price").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});

// Update trips table with proper typing
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  destination: text("destination").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPrivate: boolean("is_private").default(false),
  collaborationSettings: json("collaboration_settings").$type<CollaborationSettings>().default({
    canInvite: false,
    canEdit: false,
    canComment: true
  }),
  itinerary: json("itinerary").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  content: text("content").notNull(),
  images: json("images").default([]),
  createdAt: timestamp("created_at").defaultNow()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  conversationId: text("conversation_id").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"),
  messageType: text("message_type").notNull(),
  contextId: integer("context_id"),
  contextType: text("context_type"),
  createdAt: timestamp("created_at").defaultNow()
});

export const tripMembers = pgTable("trip_members", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").notNull().default("member"), // owner, member, viewer
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow()
});

export const tripActivities = pgTable("trip_activities", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id),
  createdBy: integer("created_by").references(() => users.id),
  type: text("type").notNull(), // suggestion, comment, update
  content: text("content").notNull(),
  metadata: json("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow()
});

// Add relations
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  owner: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  members: many(tripMembers),
  activities: many(tripActivities)
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, {
    fields: [tripMembers.tripId],
    references: [trips.id],
  }),
  user: one(users, {
    fields: [tripMembers.userId],
    references: [users.id],
  })
}));

export const tripActivitiesRelations = relations(tripActivities, ({ one }) => ({
  trip: one(trips, {
    fields: [tripActivities.tripId],
    references: [trips.id],
  }),
  creator: one(users, {
    fields: [tripActivities.createdBy],
    references: [users.id],
  })
}));

// Update insert schema with proper validation
export const insertTripSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  userId: z.number(),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().transform(str => str ? new Date(str) : null),
  endDate: z.string().transform(str => str ? new Date(str) : null),
  isPrivate: z.boolean().optional(),
  collaborationSettings: collaborationSettingsSchema.optional(),
  itinerary: z.array(z.any()).optional()
});

export const insertServiceSchema = createInsertSchema(services);

const bookingValidationSchema = z.object({
  serviceId: z.number(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().nullable().transform((str) => str ? new Date(str) : null),
  totalPrice: z.number().or(z.string()).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
  status: z.string(),
  notes: z.string().optional(),
});

export const insertBookingSchema = bookingValidationSchema;
export const selectBookingSchema = createSelectSchema(bookings);

export const insertPostSchema = createInsertSchema(posts);

export const insertMessageSchema = createInsertSchema(messages, {
  messageType: z.enum([
    'expert_inquiry',
    'trip_discussion',
    'booking_support',
    'admin_notice'
  ]),
  contextType: z.enum(['trip', 'booking', 'service']).optional(),
  status: z.enum(['read', 'unread']).default('unread'),
});

export const selectMessageSchema = createSelectSchema(messages);

export const insertTripMemberSchema = createInsertSchema(tripMembers);
export const insertTripActivitySchema = createInsertSchema(tripActivities);


export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertService = typeof services.$inferInsert;
export type InsertBooking = z.infer<typeof bookingValidationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type TripMember = typeof tripMembers.$inferSelect;
export type InsertTripMember = typeof tripMembers.$inferInsert;
export type TripActivity = typeof tripActivities.$inferSelect;
export type InsertTripActivity = typeof tripActivities.$inferInsert;
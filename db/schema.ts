import { pgTable, serial, text, timestamp, boolean, json, numeric, integer, decimal } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Add collaboration settings type
export const collaborationSettingsSchema = z.object({
  canInvite: z.boolean(),
  canEdit: z.boolean(),
  canComment: z.boolean()
});

export type CollaborationSettings = z.infer<typeof collaborationSettingsSchema>;

// Define itinerary type
export const itineraryItemSchema = z.object({
  id: z.string(),
  type: z.enum(['activity', 'transport', 'accommodation', 'meal']),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  cost: z.number().optional(),
  notes: z.string().optional()
});

export type ItineraryItem = z.infer<typeof itineraryItemSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  providerId: integer("provider_id").references(() => users.id).notNull(),
  updatedAt: timestamp("updated_at"),
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
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at"),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  destination: text("destination").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPrivate: boolean("is_private").notNull().default(true),
  collaborationSettings: json("collaboration_settings").$type<CollaborationSettings>(),
  itinerary: json("itinerary").$type<ItineraryItem[]>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at"),
});

export const tripMembers = pgTable("trip_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastActivity: timestamp("last_activity"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  receiverId: integer("receiver_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").notNull(),
  contextId: integer("context_id"),
  contextType: text("context_type"),
  status: text("status").notNull().default("unread"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tripActivities = pgTable("trip_activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  services: many(services),
  bookings: many(bookings),
  tripMembers: many(tripMembers),
  posts: many(posts),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  provider: one(users, {
    fields: [services.providerId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

export const tripsRelations = relations(trips, ({ many }) => ({
  members: many(tripMembers),
  activities: many(tripActivities),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  user: one(users, {
    fields: [tripMembers.userId],
    references: [users.id],
  }),
  trip: one(trips, {
    fields: [tripMembers.tripId],
    references: [trips.id],
  }),
}));

export const tripActivitiesRelations = relations(tripActivities, ({ one }) => ({
  trip: one(trips, {
    fields: [tripActivities.tripId],
    references: [trips.id],
  }),
  creator: one(users, {
    fields: [tripActivities.createdBy],
    references: [users.id],
  }),
}));

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

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

// Schemas for validation and type inference
export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"], {
    errorMap: () => ({ message: "Invalid role. Must be either 'user' or 'admin'" })
  }).default("user"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  avatar: z.string().url("Please provide a valid URL for the avatar").optional(),
  languages: z.array(z.string()).max(10, "Cannot add more than 10 languages").optional(),
  profileCompleted: z.boolean().optional()
});

export const insertTripSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPrivate: z.boolean().default(true),
  collaborationSettings: collaborationSettingsSchema.optional(),
  itinerary: z.array(itineraryItemSchema).optional()
});

export const insertMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  messageType: z.enum(["text", "image", "file"], {
    errorMap: () => ({ message: "Invalid message type" })
  }),
  contextId: z.number().optional(),
  contextType: z.enum(["trip", "booking", "service"], {
    errorMap: () => ({ message: "Invalid context type" })
  }).optional(),
  status: z.enum(["read", "unread"], {
    errorMap: () => ({ message: "Invalid status" })
  }).default("unread"),
});

// Create select schemas for type inference
export const selectUserSchema = createSelectSchema(users);
export const selectTripSchema = createSelectSchema(trips);
export const selectMessageSchema = createSelectSchema(messages);
export const selectServiceSchema = createSelectSchema(services);
export const selectBookingSchema = createSelectSchema(bookings);
export const selectTripMemberSchema = createSelectSchema(tripMembers);
export const selectTripActivitySchema = createSelectSchema(tripActivities);
export const selectPostSchema = createSelectSchema(posts);

// Export types
export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type TripMember = typeof tripMembers.$inferSelect;
export type TripActivity = typeof tripActivities.$inferSelect;
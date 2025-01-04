import { pgTable, text, serial, integer, boolean, timestamp, json, numeric, decimal } from "drizzle-orm/pg-core";
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
  username: text("username").unique(),  // Generated from firstName
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  firstName: text("first_name").notNull(),  // Now required
  lastName: text("last_name"),
  role: text("role").notNull().default("user"),
  bio: text("bio"),
  avatar: text("avatar"),
  languages: json("languages").default([]),
  profileCompleted: boolean("profile_completed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Create a more robust validation schema for user registration
export const insertUserSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters long").max(50, "First name cannot exceed 50 characters"),
  lastName: z.string().optional().transform(val => val || null),
  username: z.string().optional(),  // Will be generated from firstName
  role: z.enum(["user", "expert", "provider", "admin"], {
    errorMap: () => ({ message: "Invalid role selected. Please choose a valid role." })
  }).default("user"),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  avatar: z.string().url("Please provide a valid URL for the avatar").optional(),
  languages: z.array(z.string()).max(10, "Cannot add more than 10 languages").optional(),
  profileCompleted: z.boolean().optional()
});

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  location: text("location").notNull(),
  providerId: integer("provider_id").references(() => users.id).notNull(),
  category: text("category").notNull().default("General"),
  images: json("images").$type<string[]>().default([]),
  availability: json("availability").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

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

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id),
  message: text("message").notNull(),
  messageType: text("message_type", {
    enum: ["expert_inquiry", "trip_discussion", "booking_support", "admin_notice"],
  }).notNull(),
  contextId: integer("context_id"),
  contextType: text("context_type", {
    enum: ["trip", "booking", "service"],
  }),
  conversationId: text("conversation_id").notNull(),
  status: text("status", {
    enum: ["sent", "delivered", "read"],
  }).notNull().default("sent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

// Types
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

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
  startDate: z.string().nullable().transform(str => {
    if (!str) return null;
    const date = new Date(str);
    return date.toISOString();
  }),
  endDate: z.string().nullable().transform(str => {
    if (!str) return null;
    const date = new Date(str);
    return date.toISOString();
  }),
  isPrivate: z.boolean().optional(),
  collaborationSettings: collaborationSettingsSchema.optional(),
  itinerary: z.array(z.any()).optional()
});

export const insertServiceSchema = createInsertSchema(services);

const bookingValidationSchema = z.object({
  serviceId: z.number().positive("Please select a valid service"),
  startDate: z.string()
    .refine(str => !isNaN(Date.parse(str)), "Please enter a valid start date")
    .transform(str => new Date(str)),
  endDate: z.string()
    .nullable()
    .refine(str => !str || !isNaN(Date.parse(str)), "Please enter a valid end date")
    .transform(str => str ? new Date(str) : null),
  totalPrice: z.number()
    .or(z.string())
    .refine(val => !isNaN(Number(val)), "Total price must be a valid number")
    .transform(val => typeof val === "string" ? parseFloat(val) : val),
  status: z.string().min(1, "Status is required"),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
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
  ], {
    errorMap: () => ({ message: "Please select a valid message type" })
  }),
  contextType: z.enum(['trip', 'booking', 'service'], {
    errorMap: () => ({ message: "Please select a valid context type" })
  }).optional(),
  status: z.enum(['read', 'unread'], {
    errorMap: () => ({ message: "Invalid message status" })
  }).default('unread'),
});

export const selectMessageSchema = createSelectSchema(messages);

export const insertTripMemberSchema = createInsertSchema(tripMembers);
export const insertTripActivitySchema = createInsertSchema(tripActivities);

export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertBooking = z.infer<typeof bookingValidationSchema>;
export type TripMember = typeof tripMembers.$inferSelect;
export type InsertTripMember = typeof tripMembers.$inferInsert;
export type TripActivity = typeof tripActivities.$inferSelect;
export type InsertTripActivity = typeof tripActivities.$inferInsert;
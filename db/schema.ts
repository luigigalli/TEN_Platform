import { pgTable, serial, text, timestamp, boolean, json, numeric, integer, decimal, uuid, varchar, date, jsonb } from "drizzle-orm/pg-core";
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

// User roles enum
export const UserRole = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  CUSTOMER_SUPPORT: 'customer_support',
  LOCAL_EXPERT: 'local_expert',
  ACTIVITY_SUPPLIER: 'activity_supplier',
  ACCOMMODATION_SUPPLIER: 'accommodation_supplier',
  CUSTOMER: 'customer'
} as const;

// User tables
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  prefix: varchar("prefix", { length: 10 }),
  firstName: varchar("first_name").notNull(),
  middleName: varchar("middle_name"),
  lastName: varchar("last_name").notNull(),
  suffix: varchar("suffix", { length: 10 }),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  phone: varchar("phone"),
  phoneCode: varchar("phone_code"),
  birthDate: date("birth_date"),
  gender: varchar("gender", { enum: ["male", "female", "other"] }),
  imageName: varchar("image_name"),
  language: varchar("language", { enum: ["en", "es", "fr", "de", "it"] }).notNull().default("en"),
  otherLanguages: jsonb("other_languages").$type<string[]>(),
  shortBio: text("short_bio"),
  role: varchar("role", { 
    enum: [
      UserRole.ADMIN,
      UserRole.EDITOR,
      UserRole.CUSTOMER_SUPPORT,
      UserRole.LOCAL_EXPERT,
      UserRole.ACTIVITY_SUPPLIER,
      UserRole.ACCOMMODATION_SUPPLIER,
      UserRole.CUSTOMER
    ]
  }).notNull().default(UserRole.CUSTOMER),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  rememberToken: varchar("remember_token"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Groups table for organizing users
export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// User-Group relationship
export const userGroups = pgTable("user_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  providerId: integer("provider_id").references(() => users.id).notNull(),
  updatedAt: timestamp("updated_at"),
});

// Bookings table
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

// Trips table
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

// Trip members table
export const tripMembers = pgTable("trip_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tripId: integer("trip_id").references(() => trips.id),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastActivity: timestamp("last_activity"),
});

// Messages table
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

// Trip activities table
export const tripActivities = pgTable("trip_activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Posts table
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
  userGroups: many(userGroups),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  userGroups: many(userGroups),
}));

export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, {
    fields: [userGroups.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [userGroups.groupId],
    references: [groups.id],
  }),
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
  prefix: z.string().max(10).optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().max(10).optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  phoneCode: z.string().optional(),
  birthDate: z.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  imageName: z.string().optional(),
  language: z.enum(["en", "es", "fr", "de", "it"]).default("en"),
  otherLanguages: z.array(z.string()).max(10, "Cannot add more than 10 languages").optional(),
  shortBio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.EDITOR,
    UserRole.CUSTOMER_SUPPORT,
    UserRole.LOCAL_EXPERT,
    UserRole.ACTIVITY_SUPPLIER,
    UserRole.ACCOMMODATION_SUPPLIER,
    UserRole.CUSTOMER
  ]).default(UserRole.CUSTOMER),
  permissions: z.array(z.string()).optional(),
  emailVerified: z.boolean().optional(),
  emailVerifiedAt: z.date().optional(),
  rememberToken: z.string().optional(),
  active: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
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
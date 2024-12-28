import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  destination: text("destination").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPrivate: boolean("is_private").default(false),
  members: json("members").default([]),
  itinerary: json("itinerary").default([]),
  createdAt: timestamp("created_at").defaultNow()
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
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  conversationId: text("conversation_id").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"),
  messageType: text("message_type").notNull(),
  contextId: integer("context_id"),
  contextType: text("context_type"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertTripSchema = createInsertSchema(trips, {
  startDate: z.string().transform((str) => str ? new Date(str) : null),
  endDate: z.string().transform((str) => str ? new Date(str) : null),
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
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type InsertBooking = z.infer<typeof bookingValidationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

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

export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type Post = typeof posts.$inferSelect;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

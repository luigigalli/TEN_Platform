import { pgTable, text, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";

export interface NotificationPreferences {
  email: {
    marketing: boolean;
    security: boolean;
    updates: boolean;
    newsletter: boolean;
  };
  inApp: {
    mentions: boolean;
    replies: boolean;
    directMessages: boolean;
    systemUpdates: boolean;
  };
}

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("USER"),
  permissions: text("permissions").array(),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLoginAt: timestamp("last_login_at"),
  notificationPreferences: jsonb("notification_preferences").$type<NotificationPreferences>().default({
    email: {
      marketing: true,
      security: true,
      updates: true,
      newsletter: true
    },
    inApp: {
      mentions: true,
      replies: true,
      directMessages: true,
      systemUpdates: true
    }
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

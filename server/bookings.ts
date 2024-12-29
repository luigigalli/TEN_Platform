import { Request, Response } from "express";
import { z } from "zod";
import { bookings, services } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Express } from "express";
import { db } from "../db";
import { requireAuth } from "./auth";
import Stripe from "stripe";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Validation schemas
const createBookingSchema = z.object({
  serviceId: z.number().int().positive("Service ID is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable(),
  totalPrice: z.number().min(0, "Price must be non-negative"),
  notes: z.string().optional(),
});

export function setupBookingsRoutes(app: Express) {
  // Create booking
  app.post("/api/bookings", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = createBookingSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
          code: "auth_required",
        });
      }

      // Check if service exists
      const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, validatedData.serviceId))
        .limit(1);

      if (!service) {
        return res.status(404).json({
          message: "Service not found",
          code: "service_not_found",
        });
      }

      // Create booking
      const [booking] = await db.insert(bookings).values({
        userId,
        serviceId: validatedData.serviceId,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        totalPrice: validatedData.totalPrice.toString(),
        notes: validatedData.notes,
        status: "pending",
      }).returning();

      // Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(validatedData.totalPrice * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: booking.id.toString(),
          serviceId: service.id.toString(),
          userId: userId.toString(),
        },
      });

      res.json({
        booking,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid booking data",
          code: "validation_error",
          details: error.errors,
        });
      }
      res.status(500).json({
        message: "Failed to create booking",
        code: "create_error",
      });
    }
  });

  // Confirm payment
  app.post("/api/payments/confirm", requireAuth, async (req: Request, res: Response) => {
    try {
      const { bookingId, paymentIntentId } = req.body;

      if (!bookingId || !paymentIntentId) {
        return res.status(400).json({
          message: "Missing required fields",
          code: "validation_error",
        });
      }

      // Retrieve the payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: "Payment not successful",
          code: "payment_error",
        });
      }

      // Update booking status
      await db
        .update(bookings)
        .set({ status: "confirmed" })
        .where(eq(bookings.id, bookingId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({
        message: "Failed to confirm payment",
        code: "confirm_error",
      });
    }
  });

  // Get user's bookings
  app.get("/api/bookings", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Authentication required",
          code: "auth_required",
        });
      }

      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, userId));

      res.json(userBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({
        message: "Failed to fetch bookings",
        code: "fetch_error",
      });
    }
  });
}

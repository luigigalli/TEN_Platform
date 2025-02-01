import Stripe from "stripe";
import { db } from "@db";
import { bookings, services, type Booking, type Service } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Custom error class for payment-related errors
export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// Environment variable validation
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new PaymentError(
    "Missing STRIPE_SECRET_KEY environment variable",
    "MISSING_API_KEY",
    500
  );
}

// Initialize Stripe with API version and test mode configuration
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Validation schemas
const paymentIntentMetadataSchema = z.object({
  bookingId: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
});

type PaymentIntentMetadata = z.infer<typeof paymentIntentMetadataSchema>;

interface PaymentIntentResult {
  clientSecret: string;
  amount: number;
  currency: string;
  status: Stripe.PaymentIntent.Status;
  metadata: PaymentIntentMetadata;
}

interface PaymentConfirmationResult {
  success: boolean;
  bookingId: number;
  status: Booking['status'];
  updatedAt: Date;
}

/**
 * Creates a payment intent for a booking
 * @param bookingId - The ID of the booking to create a payment intent for
 * @returns A promise that resolves to the payment intent details
 * @throws {PaymentError} If the booking or service is not found, or if there's an error creating the payment intent
 */
export async function createPaymentIntent(bookingId: number): Promise<PaymentIntentResult> {
  try {
    if (!bookingId || isNaN(bookingId)) {
      throw new PaymentError(
        "Invalid booking ID",
        "INVALID_BOOKING_ID",
        400
      );
    }

    // Fetch the booking and related service
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new PaymentError(
        "Booking not found",
        "BOOKING_NOT_FOUND",
        404
      );
    }

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);

    if (!service) {
      throw new PaymentError(
        "Service not found",
        "SERVICE_NOT_FOUND",
        404
      );
    }

    const amount = Number(booking.totalPrice);
    if (isNaN(amount) || amount <= 0) {
      throw new PaymentError(
        "Invalid booking amount",
        "INVALID_AMOUNT",
        400,
        { amount }
      );
    }

    console.log('Creating payment intent for booking:', {
      bookingId,
      amount,
      serviceName: service.title
    });

    // Create metadata and validate it
    const metadata: PaymentIntentMetadata = {
      bookingId: booking.id.toString(),
      serviceId: service.id.toString(),
      serviceName: service.title,
    };

    const metadataResult = paymentIntentMetadataSchema.safeParse(metadata);
    if (!metadataResult.success) {
      throw new PaymentError(
        "Invalid payment intent metadata",
        "INVALID_METADATA",
        400,
        metadataResult.error
      );
    }

    // Create a payment intent with test mode configuration
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method_types: ['card'],
      metadata: metadataResult.data,
    });

    console.log('Payment intent created:', {
      intentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: metadataResult.data,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error instanceof PaymentError) {
      throw error;
    }

    if (error instanceof Stripe.errors.StripeError) {
      throw new PaymentError(
        error.message,
        `STRIPE_${error.type.toUpperCase()}`,
        error.statusCode ?? 500,
        { stripeCode: error.code }
      );
    }

    throw new PaymentError(
      "Payment initialization failed",
      "PAYMENT_INIT_FAILED",
      500,
      error
    );
  }
}

/**
 * Confirms a payment for a booking
 * @param bookingId - The ID of the booking to confirm payment for
 * @param paymentIntentId - The Stripe payment intent ID
 * @returns A promise that resolves to the payment confirmation result
 * @throws {PaymentError} If the payment intent is not found or not successful, or if there's an error confirming the payment
 */
export async function confirmPayment(
  bookingId: number,
  paymentIntentId: string
): Promise<PaymentConfirmationResult> {
  try {
    if (!bookingId || isNaN(bookingId)) {
      throw new PaymentError(
        "Invalid booking ID",
        "INVALID_BOOKING_ID",
        400
      );
    }

    if (!paymentIntentId) {
      throw new PaymentError(
        "Payment intent ID is required",
        "MISSING_PAYMENT_INTENT_ID",
        400
      );
    }

    console.log('Confirming payment:', { bookingId, paymentIntentId });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Retrieved payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== "succeeded") {
      throw new PaymentError(
        `Payment not successful`,
        "PAYMENT_NOT_SUCCESSFUL",
        400,
        { status: paymentIntent.status }
      );
    }

    // Verify the booking ID in metadata matches
    const metadata = paymentIntentMetadataSchema.safeParse(paymentIntent.metadata);
    if (!metadata.success || metadata.data.bookingId !== bookingId.toString()) {
      throw new PaymentError(
        "Payment intent metadata mismatch",
        "METADATA_MISMATCH",
        400,
        { expected: bookingId, received: paymentIntent.metadata.bookingId }
      );
    }

    const now = new Date();

    // Update booking status
    const [updatedBooking] = await db
      .update(bookings)
      .set({ 
        status: "confirmed" as const,
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    if (!updatedBooking) {
      throw new PaymentError(
        "Failed to update booking status",
        "BOOKING_UPDATE_FAILED",
        500
      );
    }

    console.log('Booking status updated to confirmed');
    
    return {
      success: true,
      bookingId: updatedBooking.id,
      status: updatedBooking.status,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error confirming payment:', error);
    
    if (error instanceof PaymentError) {
      throw error;
    }

    if (error instanceof Stripe.errors.StripeError) {
      throw new PaymentError(
        error.message,
        `STRIPE_${error.type.toUpperCase()}`,
        error.statusCode ?? 500,
        { stripeCode: error.code }
      );
    }

    throw new PaymentError(
      "Payment confirmation failed",
      "PAYMENT_CONFIRMATION_FAILED",
      500,
      error
    );
  }
}
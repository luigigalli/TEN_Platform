import Stripe from "stripe";
import { db } from "@db";
import { bookings, services } from "@db/schema";
import { eq } from "drizzle-orm";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

// Initialize Stripe with API version and test mode configuration
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function createPaymentIntent(bookingId: number) {
  try {
    // Fetch the booking and related service
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new Error("Booking not found");
    }

    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);

    if (!service) {
      throw new Error("Service not found");
    }

    console.log('Creating payment intent for booking:', {
      bookingId,
      amount: Number(booking.totalPrice),
      serviceName: service.title
    });

    // Create a payment intent with test mode configuration
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(booking.totalPrice) * 100), // Convert to cents
      currency: "usd",
      payment_method_types: ['card'],
      metadata: {
        bookingId: booking.id.toString(),
        serviceId: service.id.toString(),
        serviceName: service.title,
      },
    });

    console.log('Payment intent created:', {
      intentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Payment initialization failed: ${error.message}`);
  }
}

export async function confirmPayment(bookingId: number, paymentIntentId: string) {
  try {
    console.log('Confirming payment:', { bookingId, paymentIntentId });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Retrieved payment intent status:', paymentIntent.status);

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
    }

    // Update booking status
    await db
      .update(bookings)
      .set({ status: "confirmed" })
      .where(eq(bookings.id, bookingId));

    console.log('Booking status updated to confirmed');
    return { success: true };
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    throw new Error(`Payment confirmation failed: ${error.message}`);
  }
}
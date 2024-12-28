import Stripe from "stripe";
import { db } from "@db";
import { bookings, services } from "@db/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function createPaymentIntent(bookingId: number) {
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

  // Create a payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(booking.totalPrice) * 100), // Convert to cents
    currency: "usd",
    metadata: {
      bookingId: booking.id.toString(),
      serviceId: service.id.toString(),
      serviceName: service.title,
    },
  });

  return paymentIntent;
}

export async function confirmPayment(bookingId: number, paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment not successful");
  }

  // Update booking status
  await db
    .update(bookings)
    .set({ status: "confirmed" })
    .where(eq(bookings.id, bookingId));

  return { success: true };
}

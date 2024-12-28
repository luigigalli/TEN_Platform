import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn("Stripe publishable key not found. Payment features will be disabled.");
}

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

export function usePayment() {
  const processPayment = async (clientSecret: string) => {
    if (!stripePromise) {
      throw new Error("Stripe is not properly configured");
    }

    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Failed to load Stripe");
    }

    console.log('Processing payment with client secret:', clientSecret);

    try {
      // Use test card token for development
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            token: 'tok_visa', // Test token for development
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        throw new Error(error.message);
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${paymentIntent?.status}`);
      }

      console.log('Payment processed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Payment processing error:', error);
      throw error;
    }
  };

  return { processPayment };
}
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeError, PaymentIntent } from "@stripe/stripe-js";

// Constants
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const TEST_CARD_TOKEN = 'tok_visa'; // Test token for development

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  status?: PaymentIntent.Status;
}

interface PaymentError extends Error {
  code?: string;
  declineCode?: string;
  type?: string;
  stripeError?: StripeError;
}

interface UsePaymentResult {
  processPayment: (clientSecret: string) => Promise<PaymentResult>;
  isStripeAvailable: boolean;
}

/**
 * Initialize Stripe with publishable key
 * @throws {Error} If Stripe publishable key is not found
 */
const initializeStripe = (): Promise<Stripe | null> => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn("Stripe publishable key not found. Payment features will be disabled.");
    return Promise.resolve(null);
  }
  return loadStripe(STRIPE_PUBLISHABLE_KEY);
};

const stripePromise = initializeStripe();

/**
 * Hook for handling Stripe payments
 * @returns Object containing payment processing function and Stripe availability status
 */
export function usePayment(): UsePaymentResult {
  /**
   * Process a payment with Stripe
   * @param clientSecret - The client secret from the PaymentIntent
   * @returns Promise resolving to payment result
   * @throws {PaymentError} If payment processing fails
   */
  const processPayment = async (clientSecret: string): Promise<PaymentResult> => {
    if (!clientSecret) {
      throw new PaymentError("Client secret is required");
    }

    const stripe = await stripePromise;
    if (!stripe) {
      throw new PaymentError(
        "Stripe is not properly configured",
        { code: "stripe_not_configured" }
      );
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: {
              token: TEST_CARD_TOKEN,
            },
          },
        }
      );

      if (error) {
        const paymentError = new PaymentError(
          error.message || "Payment failed",
          {
            code: error.code,
            declineCode: error.decline_code,
            type: error.type,
            stripeError: error,
          }
        );
        throw paymentError;
      }

      if (!paymentIntent) {
        throw new PaymentError(
          "No payment intent returned",
          { code: "no_payment_intent" }
        );
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new PaymentError(
          `Payment failed with status: ${paymentIntent.status}`,
          { code: "payment_failed", status: paymentIntent.status }
        );
      }

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      throw new PaymentError(
        error instanceof Error ? error.message : "An unknown error occurred",
        { code: "unknown_error" }
      );
    }
  };

  return {
    processPayment,
    isStripeAvailable: Boolean(STRIPE_PUBLISHABLE_KEY),
  };
}

// Custom error class for payment errors
class PaymentError extends Error {
  code?: string;
  declineCode?: string;
  type?: string;
  stripeError?: StripeError;
  status?: PaymentIntent.Status;

  constructor(
    message: string,
    details?: {
      code?: string;
      declineCode?: string;
      type?: string;
      stripeError?: StripeError;
      status?: PaymentIntent.Status;
    }
  ) {
    super(message);
    this.name = "PaymentError";
    if (details) {
      this.code = details.code;
      this.declineCode = details.declineCode;
      this.type = details.type;
      this.stripeError = details.stripeError;
      this.status = details.status;
    }
  }
}
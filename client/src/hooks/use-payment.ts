import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeError, PaymentIntent } from "@stripe/stripe-js";
import { z } from "zod";

// Constants
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const TEST_CARD_TOKEN = 'tok_visa'; // Test token for development

// Validation schemas
const paymentStatusSchema = z.enum([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'requires_capture',
  'canceled',
  'succeeded',
]);

const paymentResultSchema = z.object({
  success: z.boolean(),
  paymentIntentId: z.string().optional(),
  status: paymentStatusSchema.optional(),
});

const paymentErrorDetailsSchema = z.object({
  code: z.string().optional(),
  declineCode: z.string().optional(),
  type: z.string().optional(),
  stripeError: z.any().optional(),
  status: paymentStatusSchema.optional(),
});

type PaymentResult = z.infer<typeof paymentResultSchema>;
type PaymentErrorDetails = z.infer<typeof paymentErrorDetailsSchema>;

class PaymentError extends Error {
  readonly code?: string;
  readonly declineCode?: string;
  readonly type?: string;
  readonly stripeError?: StripeError;
  readonly status?: PaymentIntent.Status;

  constructor(
    message: string,
    details?: PaymentErrorDetails
  ) {
    super(message);
    this.name = "PaymentError";
    
    if (details) {
      try {
        const validatedDetails = paymentErrorDetailsSchema.parse(details);
        Object.assign(this, validatedDetails);
      } catch (error) {
        console.error('Invalid payment error details:', error);
      }
    }

    // Make properties immutable
    Object.freeze(this);
  }

  static fromStripeError(error: StripeError): PaymentError {
    return new PaymentError(error.message || "Stripe error occurred", {
      code: error.code,
      declineCode: error.decline_code,
      type: error.type,
      stripeError: error,
    });
  }

  static fromUnknownError(error: unknown): PaymentError {
    if (error instanceof Error) {
      return new PaymentError(error.message, { code: "unknown_error" });
    }
    return new PaymentError("An unknown error occurred", { code: "unknown_error" });
  }
}

interface UsePaymentResult {
  processPayment: (clientSecret: string) => Promise<PaymentResult>;
  isStripeAvailable: boolean;
}

function validateClientSecret(clientSecret: string): void {
  if (!clientSecret.startsWith('pi_') && !clientSecret.includes('_secret_')) {
    throw new PaymentError("Invalid client secret format", {
      code: "invalid_client_secret"
    });
  }
}

const initializeStripe = async (): Promise<Stripe | null> => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn("Stripe publishable key not found. Payment features will be disabled.");
    return null;
  }

  try {
    const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    if (!stripe) {
      throw new PaymentError("Failed to initialize Stripe", {
        code: "stripe_initialization_failed"
      });
    }
    return stripe;
  } catch (error) {
    throw PaymentError.fromUnknownError(error);
  }
};

const stripePromise = initializeStripe();

export function usePayment(): UsePaymentResult {
  const processPayment = async (clientSecret: string): Promise<PaymentResult> => {
    try {
      validateClientSecret(clientSecret);

      const stripe = await stripePromise;
      if (!stripe) {
        throw new PaymentError("Stripe is not properly configured", {
          code: "stripe_not_configured"
        });
      }

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
        throw PaymentError.fromStripeError(error);
      }

      if (!paymentIntent) {
        throw new PaymentError("No payment intent returned", {
          code: "no_payment_intent"
        });
      }

      if (!paymentStatusSchema.safeParse(paymentIntent.status).success) {
        throw new PaymentError("Invalid payment intent status", {
          code: "invalid_payment_status",
          status: paymentIntent.status
        });
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new PaymentError(`Payment failed with status: ${paymentIntent.status}`, {
          code: "payment_failed",
          status: paymentIntent.status
        });
      }

      const result: PaymentResult = {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      };

      return paymentResultSchema.parse(result);
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error;
      }
      throw PaymentError.fromUnknownError(error);
    }
  };

  return {
    processPayment,
    isStripeAvailable: Boolean(STRIPE_PUBLISHABLE_KEY),
  };
}
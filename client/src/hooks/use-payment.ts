import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function usePayment() {
  const processPayment = async (clientSecret: string) => {
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error("Failed to load Stripe");
    }

    const { error } = await stripe.confirmPayment({
      elements: await createElements(stripe, clientSecret),
      confirmParams: {
        return_url: `${window.location.origin}/services`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  };

  return { processPayment };
}

async function createElements(stripe: Stripe, clientSecret: string): Promise<StripeElements> {
  const elements = stripe.elements({
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  });

  const paymentElement = elements.create('payment');
  const container = document.createElement('div');
  document.body.appendChild(container);
  await paymentElement.mount(container);
  return elements;
}

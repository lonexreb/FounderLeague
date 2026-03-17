import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['1 public league', 'Basic leaderboard', 'Achievement tracking'],
  },
  premium: {
    name: 'Premium',
    price: 4.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    features: [
      'Unlimited private leagues',
      'All 8 leaderboard categories',
      'Advanced analytics',
      'Priority support',
    ],
  },
} as const;

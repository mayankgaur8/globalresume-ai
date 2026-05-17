import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2026-04-22.dahlia' as any,
  typescript: true,
});

export const STRIPE_PLANS = {
  BASIC: process.env.STRIPE_PRICE_BASIC_ID || 'price_basic_123',
  PRO: process.env.STRIPE_PRICE_PRO_ID || 'price_pro_123',
  GLOBAL: process.env.STRIPE_PRICE_GLOBAL_ID || 'price_global_123',
};

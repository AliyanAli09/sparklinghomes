import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load environment variables for this module
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export default stripe;

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

class StripeConfig {
    private static instance: StripeConfig;
    public stripe: Stripe;

    private constructor() {
        const secretKey = process.env.STRIPE_SECRET_KEY;

        if (!secretKey) {
            throw new Error('Missing STRIPE_SECRET_KEY environment variable');
        }

        this.stripe = new Stripe(secretKey, {
            apiVersion: '2023-10-16' as any,
            typescript: true,
        });
    }

    public static getInstance(): StripeConfig {
        if (!StripeConfig.instance) {
            StripeConfig.instance = new StripeConfig();
        }
        return StripeConfig.instance;
    }

    public getStripe(): Stripe {
        return this.stripe;
    }

    public getPriceId(plan: 'base' | 'pro' | 'unlimited'): string {
        const priceIdMap = {
            base: process.env.STRIPE_PRICE_BASE,
            pro: process.env.STRIPE_PRICE_PRO,
            unlimited: process.env.STRIPE_PRICE_UNLIMITED,
        };

        const priceId = priceIdMap[plan];
        if (!priceId) {
            throw new Error(`Missing Stripe price ID for plan: ${plan}`);
        }

        return priceId;
    }
}

export default StripeConfig.getInstance();

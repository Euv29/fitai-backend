import { Request, Response } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { AuthRequest } from '../../shared/types/types';
import { HTTP_STATUS } from '../../shared/constants/constants';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import Stripe from 'stripe';

const subscriptionsService = new SubscriptionsService();

export class SubscriptionsController {
    // Get subscription
    getSubscription = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const subscription = await subscriptionsService.getSubscription(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: subscription,
        });
    });

    // Create checkout session
    createCheckout = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const result = await subscriptionsService.createCheckoutSession(userId, req.body);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: result,
        });
    });

    // Stripe webhook
    handleWebhook = asyncHandler(async (req: Request, res: Response) => {
        const sig = req.headers['stripe-signature'] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET not configured');
        }

        let event: Stripe.Event;

        try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } catch (err: any) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        await subscriptionsService.handleWebhook(event);

        res.status(HTTP_STATUS.OK).json({ received: true });
    });

    // Cancel subscription
    cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const result = await subscriptionsService.cancelSubscription(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            ...result,
        });
    });
}

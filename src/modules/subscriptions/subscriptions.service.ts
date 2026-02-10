import DatabaseConfig from '../../config/database.config';
import StripeConfig from '../../config/stripe.config';
import { SubscriptionCheckoutRequest } from '../../shared/types/types';
import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants/constants';
import { AppError } from '../../shared/middleware/error.middleware';
import logger from '../../shared/utils/logger.util';
import Stripe from 'stripe';

export class SubscriptionsService {
    private db = DatabaseConfig.getAdminClient();
    private stripe = StripeConfig.getStripe();

    // Get user's subscription
    async getSubscription(userId: string) {
        try {
            const { data: subscription, error } = await this.db
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error || !subscription) {
                throw new AppError(
                    HTTP_STATUS.NOT_FOUND,
                    ERROR_MESSAGES.SUBSCRIPTION_NOT_FOUND
                );
            }

            return subscription;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Get subscription error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Create Stripe checkout session
    async createCheckoutSession(
        userId: string,
        checkoutData: SubscriptionCheckoutRequest
    ) {
        try {
            // Get or create Stripe customer
            const { data: user } = await this.db
                .from('users')
                .select('email, phone')
                .eq('id', userId)
                .single();

            let { data: subscription } = await this.db
                .from('subscriptions')
                .select('stripe_customer_id')
                .eq('user_id', userId)
                .single();

            let customerId = subscription?.stripe_customer_id;

            if (!customerId) {
                const customer = await this.stripe.customers.create({
                    email: user?.email,
                    phone: user?.phone,
                    metadata: { userId },
                });

                customerId = customer.id;

                // Update subscription with customer ID
                await this.db
                    .from('subscriptions')
                    .update({ stripe_customer_id: customerId })
                    .eq('user_id', userId);
            }

            // Get price ID for the plan
            const priceId = StripeConfig.getPriceId(checkoutData.plan);

            // Create checkout session
            const session = await this.stripe.checkout.sessions.create({
                customer: customerId,
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                success_url: checkoutData.success_url,
                cancel_url: checkoutData.cancel_url,
                metadata: {
                    userId,
                    plan: checkoutData.plan,
                },
            });

            logger.info('Stripe checkout session created', { userId, sessionId: session.id });

            return {
                sessionId: session.id,
                url: session.url,
            };
        } catch (error) {
            logger.error('Create checkout session error', { error });
            throw new AppError(
                HTTP_STATUS.INTERNAL_ERROR,
                'Falha ao criar sessão de pagamento'
            );
        }
    }

    // Handle Stripe webhook
    async handleWebhook(event: Stripe.Event) {
        try {
            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                    break;

                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                    break;

                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                    break;

                case 'invoice.payment_succeeded':
                    logger.info('Payment succeeded', { event: event.id });
                    break;

                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                    break;

                default:
                    logger.info('Unhandled webhook event', { type: event.type });
            }
        } catch (error) {
            logger.error('Webhook handling error', { error, eventType: event.type });
            throw error;
        }
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId || !plan) {
            logger.error('Missing metadata in checkout session', { sessionId: session.id });
            return;
        }

        const subscriptionId = session.subscription as string;

        // Update subscription in database
        await this.db
            .from('subscriptions')
            .update({
                stripe_subscription_id: subscriptionId,
                plan,
                status: 'active',
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        logger.info('Checkout completed and subscription updated', { userId, plan });
    }

    private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;

        // Find user by customer ID
        const { data: userSubscription } = await this.db
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (!userSubscription) {
            logger.warn('Subscription not found for customer', { customerId });
            return;
        }

        await this.db
            .from('subscriptions')
            .update({
                status: subscription.status === 'active' ? 'active' : subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userSubscription.user_id);

        logger.info('Subscription updated', { userId: userSubscription.user_id });
    }

    private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const customerId = subscription.customer as string;

        const { data: userSubscription } = await this.db
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (!userSubscription) {
            return;
        }

        // Downgrade to limited free
        await this.db
            .from('subscriptions')
            .update({
                plan: 'limited_free',
                status: 'canceled',
                stripe_subscription_id: null,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userSubscription.user_id);

        logger.info('Subscription canceled, downgraded to limited_free', {
            userId: userSubscription.user_id,
        });
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice) {
        const customerId = invoice.customer as string;

        const { data: userSubscription } = await this.db
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .single();

        if (!userSubscription) {
            return;
        }

        await this.db
            .from('subscriptions')
            .update({
                status: 'past_due',
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userSubscription.user_id);

        logger.warn('Payment failed, subscription past due', {
            userId: userSubscription.user_id,
        });
    }

    // Cancel subscription
    async cancelSubscription(userId: string) {
        try {
            const { data: subscription } = await this.db
                .from('subscriptions')
                .select('stripe_subscription_id')
                .eq('user_id', userId)
                .single();

            if (!subscription?.stripe_subscription_id) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Sem assinatura ativa para cancelar');
            }

            // Cancel at period end (not immediately)
            await this.stripe.subscriptions.update(subscription.stripe_subscription_id, {
                cancel_at_period_end: true,
            });

            await this.db
                .from('subscriptions')
                .update({
                    cancel_at_period_end: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            logger.info('Subscription scheduled for cancellation', { userId });

            return { message: SUCCESS_MESSAGES.SUBSCRIPTION_CANCELED };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Cancel subscription error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }
}

import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import { validate, validationSchemas } from '../../shared/middleware/validation.middleware';
import express from 'express';

const router = Router();
const subscriptionsController = new SubscriptionsController();

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: Gestão de pagamentos e assinaturas (Stripe)
 */

/**
 * @swagger
 * /api/v1/subscriptions/webhook:
 *   post:
 *     summary: Webhook do Stripe para eventos de pagamento
 *     description: Endpoint público consumido pelo Stripe.
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Evento processado
 */
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    subscriptionsController.handleWebhook
);

// Authenticated routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/subscriptions:
 *   get:
 *     summary: Obtém status da assinatura do usuário
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status da assinatura
 */
router.get('/', subscriptionsController.getSubscription);

/**
 * @swagger
 * /api/v1/subscriptions/checkout:
 *   post:
 *     summary: Cria uma sessão de checkout do Stripe
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priceId: { type: string, example: "price_H5ggY..." }
 *     responses:
 *       200:
 *         description: Sessão criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url: { type: string, example: "https://checkout.stripe.com/..." }
 */
router.post(
    '/checkout',
    validate(validationSchemas.checkoutSchema),
    subscriptionsController.createCheckout
);

/**
 * @swagger
 * /api/v1/subscriptions/cancel:
 *   delete:
 *     summary: Cancela a assinatura atual
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assinatura cancelada
 */
router.delete('/cancel', subscriptionsController.cancelSubscription);

export default router;

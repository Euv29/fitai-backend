import { Router } from 'express';
import chatController from './chat.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import { checkUsageLimit } from '../../shared/middleware/usage-limit.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat interativo com Coach IA (Gemini)
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/chat/message:
 *   post:
 *     summary: Envia uma mensagem para o Coach IA
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string, example: "Como devo fazer agachamento corretamente?" }
 *     responses:
 *       200:
 *         description: Resposta da IA recebida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     content: { type: string, example: "Olá! Para o agachamento..." }
 */
router.post('/message', checkUsageLimit('ai_chat_count'), chatController.sendMessage);

/**
 * @swagger
 * /api/v1/chat/history:
 *   get:
 *     summary: Obtém o histórico de mensagens do usuário
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mensagens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { type: object } }
 */
router.get('/history', chatController.getHistory);

export default router;

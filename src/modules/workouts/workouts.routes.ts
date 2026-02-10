import { Router } from 'express';
import workoutsController from './workouts.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

// All workout routes are protected
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Workouts
 *   description: Geração e gestão de treinos por IA
 */

/**
 * @swagger
 * /api/v1/workouts/generate:
 *   post:
 *     summary: Gera um novo plano de treino personalizado
 *     description: Utiliza o Gemini AI para criar um programa de 4 semanas adaptado ao perfil do usuário (objetivos, equipamentos, lesões).
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Treino gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Programa de treino gerado com sucesso" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "uuid-v4" }
 *                     name: { type: string, example: "Hipertrofia Adaptada" }
 */
router.post('/generate', workoutsController.generateWorkout);

/**
 * @swagger
 * /api/v1/workouts/active:
 *   get:
 *     summary: Recupera o plano de treino ativo do usuário
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plano ativo retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 */
/**
 * @swagger
 * /api/v1/workouts/log:
 *   post:
 *     summary: Registra a conclusão de uma sessão de treino
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_id: { type: string }
 *               duration_minutes: { type: number }
 *               exercises: { type: array, items: { type: object } }
 *     responses:
 *       201:
 *         description: Treino registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Sessão de treino registrada com sucesso" }
 */
router.post('/log', workoutsController.logSession);

export default router;

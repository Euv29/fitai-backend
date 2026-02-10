import { Router } from 'express';
import exercisesController from './exercises.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';

const router = Router();

// Routes require auth
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/exercises:
 *   get:
 *     summary: Busca exercícios com filtros
 *     description: Retorna uma lista de exercícios permitindo filtrar por nome, grupo muscular ou equipamento.
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         example: "bench press"
 *       - in: query
 *         name: bodyPart
 *         schema:
 *           type: string
 *         example: "chest"
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         example: "barbell"
 *     responses:
 *       200:
 *         description: Lista de exercícios retornada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string, example: "0001" }
 *                       name: { type: string, example: "Bench Press" }
 *                       body_part: { type: string, example: "chest" }
 *
 * /api/v1/exercises/{id}:
 *   get:
 *     summary: Detalhes de um exercício
 *     description: Retorna informações completas de um exercício pelo ID.
 *     tags: [Exercises]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "0001"
 *     responses:
 *       200:
 *         description: Detalhes do exercício retornados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 */

router.get('/', exercisesController.search);
router.get('/:id', exercisesController.getById);

export default router;

import { Router } from 'express';
import nutritionController from './nutrition.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import { checkUsageLimit } from '../../shared/middleware/usage-limit.middleware';
import { upload } from '../../shared/middleware/upload.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Nutrition
 *   description: Planejamento nutricional e receitas com IA
 */

router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/nutrition/generate:
 *   post:
 *     summary: Gera um plano alimentar personalizado
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plano alimentar gerado
 */
router.post('/generate', checkUsageLimit('recipe_generation_count'), nutritionController.generatePlan);

/**
 * @swagger
 * /api/v1/nutrition/recipes:
 *   get:
 *     summary: Busca receitas saudáveis
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         example: "smoothie de proteína"
 *     responses:
 *       200:
 *         description: Lista de receitas
 */
router.get('/recipes', checkUsageLimit('recipe_generation_count'), nutritionController.searchRecipes);

/**
 * @swagger
 * /api/v1/nutrition/analyze:
 *   post:
 *     summary: Analisa uma foto de comida
 *     tags: [Nutrition]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 */
router.post(
    '/analyze',
    checkUsageLimit('image_analysis_count'),
    upload.single('image'),
    nutritionController.analyzeFood
);

export default router;

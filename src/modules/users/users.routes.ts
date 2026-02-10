import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateToken } from '../../shared/middleware/auth.middleware';
import { upload } from '../../shared/middleware/upload.middleware';
import { validate, validationSchemas } from '../../shared/middleware/validation.middleware';

const router = Router();
const usersController = new UsersController();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestão de perfil e usuários
 */

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Obtém o perfil do usuário logado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: "uuid-v4" }
 *                     email: { type: string, example: "user@example.com" }
 *                     full_name: { type: string, example: "João Silva" }
 */
router.get('/profile', usersController.getProfile);

/**
 * @swagger
 * /api/v1/users/complete-profile:
 *   post:
 *     summary: Completa o perfil após cadastro inicial
 *     description: Define objetivos, experiência, equipamentos e lesões.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               goal: { type: string, example: "weight_loss", enum: ["weight_loss", "muscle_gain", "fitness", "flexibility"] }
 *               experience_level: { type: string, example: "beginner", enum: ["beginner", "intermediate", "advanced"] }
 *               available_equipment: { type: array, items: { type: string }, example: ["dumbbells", "bench"] }
 *               injuries: { type: array, items: { type: string }, example: ["lower_back"] }
 *     responses:
 *       200:
 *         description: Perfil completado com sucesso
 */
router.post(
    '/complete-profile',
    validate(validationSchemas.profileCompletionSchema),
    usersController.completeProfile
);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Atualiza dados do perfil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil atualizado
 */
router.put('/profile', usersController.updateProfile);

/**
 * @swagger
 * /api/v1/users/schedule:
 *   get:
 *     summary: Obtém a agenda semanal de treinos
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agenda retornada
 */
router.get('/schedule', usersController.getWeeklySchedule);

/**
 * @swagger
 * /api/v1/users/account:
 *   delete:
 *     summary: Exclui a conta do usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Conta excluída
 */
router.delete('/account', usersController.deleteAccount);

/**
 * @swagger
 * /api/v1/users/progress-photos:
 *   get:
 *     summary: Obtém as fotos de progresso do usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fotos retornada
 */
router.get('/progress-photos', usersController.getProgressPhotos);

/**
 * @swagger
 * /api/v1/users/progress-photos:
 *   post:
 *     summary: Faz upload de uma foto de progresso
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *               weight: { type: number }
 */
router.post('/progress-photos', upload.single('image'), usersController.uploadProgressPhoto);

export default router;

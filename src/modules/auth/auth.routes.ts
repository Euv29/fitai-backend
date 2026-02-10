import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate, validationSchemas } from '../../shared/middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API de autenticação e verificação
 */

/**
 * @swagger
 * /api/v1/auth/send-code:
 *   post:
 *     summary: Envia código de verificação
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Número de telefone com código do país (E.164)
 *                 example: "+351912345678"
 *     responses:
 *       200:
 *         description: Código enviado com sucesso
 */
router.post(
    '/send-code',
    validate(validationSchemas.sendCodeSchema),
    authController.sendCode
);

/**
 * @swagger
 * /api/v1/auth/verify-code:
 *   post:
 *     summary: Verifica o código e realiza login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+351912345678"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 */
router.post(
    '/verify-code',
    validate(validationSchemas.verifyCodeSchema),
    authController.verifyCode
);

export default router;

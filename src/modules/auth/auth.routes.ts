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

/**
 * @swagger
 * /api/v1/auth/signup/email:
 *   post:
 *     summary: Cadastro com E-mail e Senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: Usuário criado, verifique o e-mail }
 */
router.post('/signup/email', authController.signUpEmail);

/**
 * @swagger
 * /api/v1/auth/verify/email:
 *   post:
 *     summary: Verifica código do E-mail e faz login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *     responses:
 *       200: { description: Login realizado }
 */
router.post('/verify/email', authController.verifyEmail);

/**
 * @swagger
 * /api/v1/auth/login/email:
 *   post:
 *     summary: Login com E-mail e Senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login realizado }
 */
router.post('/login/email', authController.loginEmail);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Solicita recuperação de senha
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Código enviado (se e-mail existir) }
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Redefine a senha usando o código
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Senha alterada }
 */
router.post('/reset-password', authController.resetPassword);

export default router;

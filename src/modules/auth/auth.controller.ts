import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../../shared/constants/constants';
import { asyncHandler } from '../../shared/middleware/error.middleware';

const authService = new AuthService();

export class AuthController {
    // Send verification code
    sendCode = asyncHandler(async (req: Request, res: Response) => {
        const { phone, countryCode } = req.body;

        await authService.sendVerificationCode(phone, countryCode || '+351');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.CODE_SENT,
        });
    });

    // Verify code and login
    verifyCode = asyncHandler(async (req: Request, res: Response) => {
        const { phone, code } = req.body;

        const result = await authService.verifyCode(phone, code);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
            data: result,
        });
    });

    // Sign up with Email
    signUpEmail = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        await authService.signUpEmail(email, password);
        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Usuário criado. Verifique seu e-mail.',
        });
    });

    // Verify Email
    verifyEmail = asyncHandler(async (req: Request, res: Response) => {
        const { email, code } = req.body;
        const result = await authService.verifyEmail(email, code);
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
            data: result,
        });
    });

    // Login with Email
    loginEmail = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const result = await authService.loginEmail(email, password);
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
            data: result,
        });
    });

    // Forgot Password
    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;
        await authService.forgotPassword(email);
        // Always return success to prevent enumeration
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Se o e-mail existir, um código foi enviado.',
        });
    });

    // Reset Password
    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email, code, newPassword } = req.body;
        await authService.resetPassword(email, code, newPassword);
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Senha alterada com sucesso.',
        });
    });
}

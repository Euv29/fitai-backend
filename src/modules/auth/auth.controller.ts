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
}

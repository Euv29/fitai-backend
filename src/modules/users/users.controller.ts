import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../../shared/types/types';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../../shared/constants/constants';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';

const usersService = new UsersService();

export class UsersController {
    // Get current user profile
    getProfile = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const user = await usersService.getUserProfile(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: user,
        });
    });

    // Complete profile (onboarding)
    completeProfile = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const user = await usersService.completeProfile(userId, req.body);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.PROFILE_UPDATED,
            data: user,
        });
    });

    // Update profile
    updateProfile = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const user = await usersService.updateProfile(userId, req.body);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.PROFILE_UPDATED,
            data: user,
        });
    });

    // Get weekly schedule
    getWeeklySchedule = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        const schedule = await usersService.getWeeklySchedule(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: schedule,
        });
    });

    /**
     * Get user progress photos
     */
    public getProgressPhotos = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const photos = await usersService.getProgressPhotos(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: photos,
        });
    });

    /**
     * Upload progress photo
     */
    public uploadProgressPhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const { weight } = req.body;
        const file = req.file;

        if (!file) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Nenhuma imagem enviada');
        }

        const photo = await usersService.uploadProgressPhoto(
            userId,
            file.buffer,
            weight ? parseFloat(weight) : undefined
        );

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            data: photo,
        });
    });

    // Delete account
    deleteAccount = asyncHandler(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.userId;

        await usersService.deleteAccount(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Conta deletada com sucesso',
        });
    });
}

export default new UsersController();

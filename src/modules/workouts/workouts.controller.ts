import { Response } from 'express';
import { AuthRequest } from '../../shared/types/types';
import workoutsService from './workouts.service';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../../shared/constants/constants';
import { asyncHandler } from '../../shared/middleware/error.middleware';

class WorkoutsController {
    /**
     * Generate a new workout plan for the authenticated user
     */
    public generateWorkout = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const program = await workoutsService.generateWorkoutPlan(userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SUCCESS_MESSAGES.WORKOUT_GENERATED,
            data: program,
        });
    });

    /**
     * Get the current active workout program
     */
    public getActiveProgram = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const program = await workoutsService.getActiveProgram(userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: program,
        });
    });
    /**
     * Log a completed workout session
     */
    public logSession = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.userId;
        const log = await workoutsService.logWorkoutSession(userId, req.body);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SUCCESS_MESSAGES.WORKOUT_LOGGED,
            data: log,
        });
    });
}

export default new WorkoutsController();

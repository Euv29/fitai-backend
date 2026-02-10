import { Request, Response } from 'express';
import exercisesService from './exercises.service';
import { HTTP_STATUS } from '../../shared/constants/constants';
import { asyncHandler } from '../../shared/middleware/error.middleware';

class ExercisesController {
    /**
     * Search for exercises
     */
    public search = asyncHandler(async (req: Request, res: Response) => {
        const { name, bodyPart, equipment } = req.query;

        const exercises = await exercisesService.searchExercises(
            name as string,
            bodyPart as string,
            equipment as string
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: exercises,
        });
    });

    /**
     * Get exercise by ID
     */
    public getById = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const exercise = await exercisesService.getExerciseById(id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: exercise,
        });
    });
}

export default new ExercisesController();

import { Response } from 'express';
import { AuthRequest } from '../../shared/types/types';
import nutritionService from './nutrition.service';
import { HTTP_STATUS } from '../../shared/constants/constants';
import { asyncHandler, AppError } from '../../shared/middleware/error.middleware';
import { incrementUsage } from '../../shared/middleware/usage-limit.middleware';

class NutritionController {
    /**
     * Generate a personalized meal plan
     */
    public generatePlan = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId || '';
        const plan = await nutritionService.generateMealPlan(userId);

        // Increment usage
        await incrementUsage(userId, 'recipe_generation_count');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: plan,
        });
    });

    /**
     * Search for healthy recipes
     */
    public searchRecipes = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { query } = req.query;
        const userId = req.user?.userId || '';
        const recipes = await nutritionService.searchRecipes(query as string);

        // Increment usage
        await incrementUsage(userId, 'recipe_generation_count');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: recipes,
        });
    });
    /**
     * Analyze food image
     */
    public analyzeFood = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.userId || '';
        const file = req.file;

        if (!file) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Nenhuma imagem enviada');
        }

        const analysis = await nutritionService.analyzeFoodImage(
            userId,
            file.buffer,
            file.mimetype
        );

        // Increment usage
        await incrementUsage(userId, 'image_analysis_count');

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: analysis,
        });
    });
}

export default new NutritionController();

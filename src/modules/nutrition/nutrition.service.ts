import logger from '../../shared/utils/logger.util';
import aiConfig from '../../config/ai.config';
import databaseConfig from '../../config/database.config';
import { AppError } from '../../shared/middleware/error.middleware';
import { HTTP_STATUS } from '../../shared/constants/constants';
import { Recipe } from '../../shared/types/types';

class NutritionService {
    private supabase = databaseConfig.getClient();

    /**
     * Generate meal plan using AI
     */
    public async generateMealPlan(userId: string) {
        try {
            logger.info('Generating real meal plan with Gemini', { userId });

            // 1. Get user profile
            const { data: user } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            // 2. Construct prompt
            const prompt = `
                Como um nutricionista esportivo de elite, gere um plano alimentar diário para o usuário:
                - Nome: ${user?.name}
                - Peso: ${user?.weight_kg}kg
                - Altura: ${user?.height_cm}cm
                - Objetivo: ${user?.fitness_goal}
                - Nível de atividade: ${user?.activity_level}
                
                RETORNE APENAS UM JSON no seguinte formato:
                {
                    "name": "Nome do Plano",
                    "total_calories": número,
                    "macros": { "protein": número, "carbs": número, "fat": número },
                    "meals": [
                        { "time": "Horário/Refeição", "items": ["item 1", "item 2"], "calories": número }
                    ]
                }
            `;

            const model = aiConfig.getTextModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonStr = text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error('Meal plan generation error', { error, userId });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao gerar plano alimentar');
        }
    }

    /**
     * Search for recipes using AI
     */
    public async searchRecipes(query: string): Promise<Recipe[]> {
        try {
            logger.info('Searching real recipes with Gemini', { query });

            const prompt = `
                Gere uma lista de 3 receitas saudáveis baseadas na busca: "${query}".
                As receitas devem ser detalhadas e nutritivas.
                
                RETORNE APENAS UM JSON no formato de array de objetos Recipe:
                [
                    {
                        "title": "Nome",
                        "description": "Breve info",
                        "prep_time_minutes": número,
                        "instructions": ["passo 1", "passo 2"],
                        "ingredients": [{ "item": "nome", "quantity": "valor", "unit": "unidade" }],
                        "calories": número,
                        "protein_g": número,
                        "carbs_g": número,
                        "fat_g": número
                    }
                ]
            `;

            const model = aiConfig.getTextModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonStr = text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error('Recipe search error', { error, query });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao buscar receitas');
        }
    }

    /**
     * Analyze food image using Gemini Vision
     */
    public async analyzeFoodImage(userId: string, imageBuffer: Buffer, mimeType: string) {
        try {
            logger.info('Analyzing food image with Gemini Vision', { userId });

            const model = aiConfig.getVisionModel();
            const prompt = `
                Analise esta imagem de comida e estime os valores nutricionais.
                RETORNE APENAS UM JSON no seguinte formato:
                {
                    "food_item": "Nome do prato/alimento",
                    "calories": número,
                    "protein_g": número,
                    "carbs_g": número,
                    "fat_g": número,
                    "serving_size": "descrição do tamanho da porção estimada",
                    "health_rating": número (1-10)
                }
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: imageBuffer.toString('base64'),
                        mimeType,
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();

            const jsonStr = text.replace(/```json|```/g, '').trim();
            const analysis = JSON.parse(jsonStr);

            // Optional: Save analysis record to database if we had a food_logs table
            // For now, return the AI analysis

            return analysis;
        } catch (error) {
            logger.error('Food image analysis error', { error, userId });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao analisar imagem da comida');
        }
    }
}

export default new NutritionService();

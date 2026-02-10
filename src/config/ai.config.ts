import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import dotenv from 'dotenv';
import { GEMINI_CONFIG } from '../shared/constants/constants';

dotenv.config();

class AIConfig {
    private static instance: AIConfig;
    private genAI: GoogleGenerativeAI;

    private constructor() {
        const apiKey = process.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            throw new Error('Missing GOOGLE_AI_API_KEY environment variable');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    public static getInstance(): AIConfig {
        if (!AIConfig.instance) {
            AIConfig.instance = new AIConfig();
        }
        return AIConfig.instance;
    }

    public getTextModel(): GenerativeModel {
        return this.genAI.getGenerativeModel({
            model: GEMINI_CONFIG.TEXT_MODEL,
        });
    }

    public getVisionModel(): GenerativeModel {
        return this.genAI.getGenerativeModel({
            model: GEMINI_CONFIG.VISION_MODEL,
        });
    }

    public getCustomModel(systemInstruction: string): GenerativeModel {
        const params: any = {
            model: GEMINI_CONFIG.TEXT_MODEL,
            systemInstruction,
            generationConfig: {
                temperature: GEMINI_CONFIG.TEMPERATURE,
                maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
            },
        };
        return this.genAI.getGenerativeModel(params);
    }
}

export default AIConfig.getInstance();

import { Request, Response, NextFunction } from 'express';
import Joi, { ObjectSchema } from 'joi';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/constants';

export const validate = (schema: ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorDetails = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Validation Error',
                message: ERROR_MESSAGES.VALIDATION_ERROR,
                statusCode: HTTP_STATUS.BAD_REQUEST,
                details: errorDetails,
            });
            return;
        }

        // Replace req.body with validated value
        req.body = value;
        next();
    };
};

// Common validation schemas
export const validationSchemas = {
    // Auth schemas
    sendCodeSchema: Joi.object({
        phone: Joi.string()
            .pattern(/^\+?[1-9]\d{1,14}$/)
            .required()
            .messages({
                'string.pattern.base': 'Formato de telefone inválido (use E.164)',
            }),
        countryCode: Joi.string().default('+351'),
    }),

    verifyCodeSchema: Joi.object({
        phone: Joi.string()
            .pattern(/^\+?[1-9]\d{1,14}$/)
            .required(),
        code: Joi.string()
            .pattern(/^\d{6}$/)
            .required()
            .messages({
                'string.pattern.base': 'Código deve ter 6 dígitos',
            }),
    }),

    signUpEmailSchema: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }),

    verifyEmailSchema: Joi.object({
        email: Joi.string().email().required(),
        code: Joi.string()
            .pattern(/^\d{6}$/)
            .required()
            .messages({
                'string.pattern.base': 'Código deve ter 6 dígitos',
            }),
    }),

    loginEmailSchema: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    forgotPasswordSchema: Joi.object({
        email: Joi.string().email().required(),
    }),

    resetPasswordSchema: Joi.object({
        email: Joi.string().email().required(),
        code: Joi.string()
            .pattern(/^\d{6}$/)
            .required()
            .messages({
                'string.pattern.base': 'Código deve ter 6 dígitos',
            }),
        newPassword: Joi.string().min(6).required(),
    }),

    // Profile schemas
    profileCompletionSchema: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        age: Joi.number().integer().min(13).max(120).required(),
        weight_kg: Joi.number().min(30).max(300).required(),
        height_cm: Joi.number().min(100).max(250).required(),
        gender: Joi.string()
            .valid('male', 'female', 'other', 'prefer_not_to_say')
            .required(),
        fitness_goal: Joi.string()
            .valid(
                'lose_weight',
                'gain_muscle',
                'maintain',
                'endurance',
                'flexibility',
                'general_health'
            )
            .required(),
        experience_level: Joi.string()
            .valid('beginner', 'intermediate', 'advanced')
            .required(),
        activity_level: Joi.string()
            .valid('sedentary', 'lightly_active', 'moderately_active', 'very_active')
            .required(),
        gym_access: Joi.boolean().required(),
        home_equipment: Joi.array().items(Joi.string()).default([]),
        medical_conditions: Joi.string().allow('').optional(),
        injuries: Joi.array().items(Joi.string()).default([]),
        weekly_schedule: Joi.array()
            .items(
                Joi.object({
                    day_of_week: Joi.number().integer().min(0).max(6).required(),
                    available: Joi.boolean().required(),
                    preferred_time: Joi.string()
                        .valid('morning', 'afternoon', 'evening')
                        .optional(),
                    duration_minutes: Joi.number().integer().min(15).max(180).optional(),
                })
            )
            .required(),
        preferred_language: Joi.string()
            .valid('pt-BR', 'en-US', 'es-ES', 'fr-FR')
            .default('pt-BR'),
        units: Joi.string().valid('metric', 'imperial').default('metric'),
    }),

    // Chat schemas
    chatMessageSchema: Joi.object({
        message: Joi.string().min(1).max(2000).required(),
        language: Joi.string()
            .valid('pt-BR', 'en-US', 'es-ES', 'fr-FR')
            .default('pt-BR'),
    }),

    // Recipe schemas
    recipeGenerationSchema: Joi.object({
        category: Joi.string()
            .valid(
                'pre_workout',
                'post_workout',
                'breakfast',
                'lunch',
                'dinner',
                'snacks',
                'high_protein',
                'low_carb',
                'vegetarian',
                'vegan'
            )
            .optional(),
        dietary_preferences: Joi.array().items(Joi.string()).default([]),
        allergies: Joi.array().items(Joi.string()).default([]),
        calorie_target: Joi.number().integer().min(100).max(5000).optional(),
        cooking_time: Joi.string()
            .valid('quick', 'moderate', 'elaborate')
            .default('moderate'),
    }),

    // Workout schemas
    workoutCompletionSchema: Joi.object({
        session_id: Joi.string().uuid().required(),
        duration_minutes: Joi.number().integer().min(1).max(300).required(),
        exercises: Joi.array()
            .items(
                Joi.object({
                    exercise_db_id: Joi.string().optional(),
                    exercise_name: Joi.string().required(),
                    sets_completed: Joi.number().integer().min(0).required(),
                    actual_reps: Joi.array().items(Joi.number().integer()).required(),
                    actual_weight_kg: Joi.array().items(Joi.number()).optional(),
                    difficulty_rating: Joi.number().integer().min(1).max(5).optional(),
                    notes: Joi.string().max(500).allow('').optional(),
                    duration_seconds: Joi.number().integer().optional(),
                })
            )
            .required(),
        notes: Joi.string().max(1000).allow('').optional(),
    }),

    // Subscription schemas
    checkoutSchema: Joi.object({
        plan: Joi.string().valid('base', 'pro', 'unlimited').required(),
        success_url: Joi.string().uri().required(),
        cancel_url: Joi.string().uri().required(),
    }),
};

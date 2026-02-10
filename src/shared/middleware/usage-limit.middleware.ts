import { Request, Response, NextFunction } from 'express';
import DatabaseConfig from '../../config/database.config';
import { AuthRequest } from '../types/types';
import { SUBSCRIPTION_LIMITS, ERROR_MESSAGES, HTTP_STATUS } from '../constants/constants';
import { AppError } from './error.middleware';
import logger from '../utils/logger.util';

export const checkUsageLimit = (limitType: 'ai_chat_count' | 'recipe_generation_count' | 'image_analysis_count') => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.userId;

            if (!userId) {
                throw new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
            }

            const db = DatabaseConfig.getAdminClient();

            // Get user's subscription
            const { data: subscription, error: subError } = await db
                .from('subscriptions')
                .select('plan')
                .eq('user_id', userId)
                .single();

            if (subError || !subscription) {
                throw new AppError(
                    HTTP_STATUS.NOT_FOUND,
                    ERROR_MESSAGES.SUBSCRIPTION_NOT_FOUND
                );
            }

            const plan = subscription.plan as keyof typeof SUBSCRIPTION_LIMITS;
            const limits = SUBSCRIPTION_LIMITS[plan];

            // Get limit for the specific type
            const maxLimit = limits[`${limitType.replace('_count', '')}_limit` as keyof typeof limits];

            // Get today's usage
            const { data: usage } = await db
                .from('usage_limits')
                .select(limitType)
                .eq('user_id', userId)
                .eq('date', new Date().toISOString().split('T')[0])
                .single();

            const currentUsage = (usage as any)?.[limitType] || 0;

            if (currentUsage >= maxLimit) {
                logger.warn('Usage limit exceeded', {
                    userId,
                    limitType,
                    currentUsage,
                    maxLimit,
                    plan,
                });

                throw new AppError(
                    HTTP_STATUS.FORBIDDEN,
                    ERROR_MESSAGES.USAGE_LIMIT_EXCEEDED,
                    {
                        limitType,
                        currentUsage,
                        maxLimit,
                        plan,
                        upgradeRequired: true,
                    }
                );
            }

            next();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Usage limit check error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    };
};

export const incrementUsage = async (
    userId: string,
    limitType: 'ai_chat_count' | 'recipe_generation_count' | 'image_analysis_count'
): Promise<void> => {
    try {
        const db = DatabaseConfig.getAdminClient();
        const today = new Date().toISOString().split('T')[0];

        // Upsert usage record
        const { data: existing } = await db
            .from('usage_limits')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

        if (existing) {
            // Update existing record
            await db
                .from('usage_limits')
                .update({
                    [limitType]: existing[limitType] + 1,
                })
                .eq('user_id', userId)
                .eq('date', today);
        } else {
            // Create new record
            await db.from('usage_limits').insert({
                user_id: userId,
                date: today,
                [limitType]: 1,
            });
        }
    } catch (error) {
        logger.error('Failed to increment usage', { userId, limitType, error });
        // Don't throw error here to avoid breaking the main flow
    }
};

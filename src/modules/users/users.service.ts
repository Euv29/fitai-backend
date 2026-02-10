import DatabaseConfig from '../../config/database.config';
import encryptionUtil from '../../shared/utils/encryption.util';
import { ProfileCompletionRequest, User, WeeklySchedule } from '../../shared/types/types';
import { ERROR_MESSAGES, HTTP_STATUS } from '../../shared/constants/constants';
import { AppError } from '../../shared/middleware/error.middleware';
import logger from '../../shared/utils/logger.util';

export class UsersService {
    private db = DatabaseConfig.getAdminClient();

    // Get user profile
    async getUserProfile(userId: string): Promise<User> {
        try {
            const { data: user, error } = await this.db
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !user) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            // Decrypt medical conditions if present
            if (user.medical_conditions_encrypted) {
                try {
                    user.medical_conditions = encryptionUtil.decrypt(
                        user.medical_conditions_encrypted
                    );
                } catch (decryptError) {
                    logger.error('Failed to decrypt medical conditions', { error: decryptError });
                }
            }

            delete user.medical_conditions_encrypted;
            return user;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Get user profile error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Complete user profile (onboarding)
    async completeProfile(
        userId: string,
        profileData: ProfileCompletionRequest
    ): Promise<User> {
        try {
            // Check if profile already completed
            const { data: existingUser } = await this.db
                .from('users')
                .select('profile_completed')
                .eq('id', userId)
                .single();

            if (existingUser?.profile_completed) {
                throw new AppError(
                    HTTP_STATUS.BAD_REQUEST,
                    ERROR_MESSAGES.PROFILE_ALREADY_COMPLETE
                );
            }

            // Encrypt medical conditions if provided
            let medicalConditionsEncrypted: string | undefined;
            if (profileData.medical_conditions) {
                medicalConditionsEncrypted = encryptionUtil.encrypt(
                    profileData.medical_conditions
                );
            }

            // Update user profile
            const { data: updatedUser, error: updateError } = await this.db
                .from('users')
                .update({
                    name: profileData.name,
                    age: profileData.age,
                    weight_kg: profileData.weight_kg,
                    height_cm: profileData.height_cm,
                    gender: profileData.gender,
                    fitness_goal: profileData.fitness_goal,
                    experience_level: profileData.experience_level,
                    activity_level: profileData.activity_level,
                    gym_access: profileData.gym_access,
                    home_equipment: profileData.home_equipment || [],
                    medical_conditions_encrypted: medicalConditionsEncrypted,
                    injuries: profileData.injuries || [],
                    preferred_language: profileData.preferred_language || 'pt-BR',
                    units: profileData.units || 'metric',
                    profile_completed: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();

            if (updateError || !updatedUser) {
                logger.error('Failed to update user profile', { error: updateError });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            // Save weekly schedule
            if (profileData.weekly_schedule && profileData.weekly_schedule.length > 0) {
                // Delete existing schedules
                await this.db.from('weekly_schedules').delete().eq('user_id', userId);

                // Insert new schedules
                const schedules = profileData.weekly_schedule.map((schedule) => ({
                    user_id: userId,
                    day_of_week: schedule.day_of_week,
                    available: schedule.available,
                    preferred_time: schedule.preferred_time,
                    duration_minutes: schedule.duration_minutes,
                }));

                const { error: scheduleError } = await this.db
                    .from('weekly_schedules')
                    .insert(schedules);

                if (scheduleError) {
                    logger.error('Failed to save weekly schedule', { error: scheduleError });
                }
            }

            logger.info('User profile completed', { userId });
            return this.getUserProfile(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Complete profile error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Update user profile
    async updateProfile(
        userId: string,
        updates: Partial<ProfileCompletionRequest>
    ): Promise<User> {
        try {
            const updateData: any = { ...updates };

            // Encrypt medical conditions if updated
            if (updates.medical_conditions !== undefined) {
                updateData.medical_conditions_encrypted = updates.medical_conditions
                    ? encryptionUtil.encrypt(updates.medical_conditions)
                    : null;
                delete updateData.medical_conditions;
            }

            updateData.updated_at = new Date().toISOString();

            const { error } = await this.db
                .from('users')
                .update(updateData)
                .eq('id', userId);

            if (error) {
                logger.error('Failed to update profile', { error });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            // Update weekly schedule if provided
            if (updates.weekly_schedule) {
                await this.db.from('weekly_schedules').delete().eq('user_id', userId);

                const schedules = updates.weekly_schedule.map((schedule) => ({
                    user_id: userId,
                    day_of_week: schedule.day_of_week,
                    available: schedule.available,
                    preferred_time: schedule.preferred_time,
                    duration_minutes: schedule.duration_minutes,
                }));

                await this.db.from('weekly_schedules').insert(schedules);
            }

            logger.info('User profile updated', { userId });
            return this.getUserProfile(userId);
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Update profile error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Get weekly schedule
    async getWeeklySchedule(userId: string): Promise<WeeklySchedule[]> {
        try {
            const { data, error } = await this.db
                .from('weekly_schedules')
                .select('*')
                .eq('user_id', userId)
                .order('day_of_week');

            if (error) {
                logger.error('Failed to get weekly schedule', { error });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            return data || [];
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Get weekly schedule error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Delete user account (GDPR compliance)
    async deleteAccount(userId: string): Promise<void> {
        try {
            // Soft delete: anonymize user data
            const { error } = await this.db
                .from('users')
                .update({
                    phone: `deleted_${userId.slice(0, 8)}`,
                    email: null,
                    name: 'Deleted User',
                    medical_conditions_encrypted: null,
                    injuries: [],
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (error) {
                logger.error('Failed to delete account', { error });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            // Hard delete sensitive data
            await this.db.from('chat_messages').delete().eq('user_id', userId);
            await this.db.from('progress_photos').delete().eq('user_id', userId);

            logger.info('User account deleted', { userId });
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Delete account error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Get progress photos
    async getProgressPhotos(userId: string) {
        try {
            const { data, error } = await this.db
                .from('progress_photos')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                logger.error('Failed to get progress photos', { error });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            return data || [];
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Get progress photos error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Upload progress photo
    async uploadProgressPhoto(userId: string, imageData: Buffer, weight?: number) {
        try {
            const imageBase64 = imageData.toString('base64');

            const { data, error } = await this.db
                .from('progress_photos')
                .insert({
                    user_id: userId,
                    image_url: `data:image/jpeg;base64,${imageBase64}`,
                    weight_kg: weight,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error || !data) {
                logger.error('Failed to upload progress photo', { error });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            return data;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Upload progress photo error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }
}

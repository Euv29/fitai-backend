import { SupabaseClient } from '@supabase/supabase-js';
import databaseConfig from '../../config/database.config';
import aiConfig from '../../config/ai.config';
import {
    WorkoutProgram,
    WeeklySchedule
} from '../../shared/types/types';
import { AppError } from '../../shared/middleware/error.middleware';
import { ERROR_MESSAGES, HTTP_STATUS } from '../../shared/constants/constants';
import logger from '../../shared/utils/logger.util';

interface AIWorkoutSession {
    day_of_week: number;
    session_name: string;
    session_type: string;
    estimated_duration_minutes: number;
    exercises: {
        exercise_name: string;
        sets: number;
        reps: string;
        rest_seconds: number;
        order_index: number;
        notes?: string;
        target_muscle?: string;
    }[];
}

interface AIWorkoutProgram {
    name: string;
    description: string;
    weekly_split: string;
    sessions: AIWorkoutSession[];
}

class WorkoutsService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = databaseConfig.getClient();
    }

    /**
     * Generate a personalized workout plan using Gemini AI
     */
    public async generateWorkoutPlan(userId: string): Promise<WorkoutProgram> {
        try {
            // 1. Get full user profile and schedule
            const { data: user, error: userError } = await this.supabase
                .from('users')
                .select('*, weekly_schedules(*)')
                .eq('id', userId)
                .single();

            if (userError || !user) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
            }

            if (!user.profile_completed) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.PROFILE_INCOMPLETE);
            }

            // 2. Archive previous active programs
            await this.supabase
                .from('workout_programs')
                .update({ status: 'archived' })
                .eq('user_id', userId)
                .eq('status', 'active');

            // 3. Construct AI Prompt
            const prompt = this.constructWorkoutPrompt(user);
            logger.info('Generating workout with AI', { userId });

            // 4. Call Gemini
            const model = aiConfig.getTextModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // 5. Parse AI Response
            const aiProgram = this.parseAIResponse(text);

            // 6. Save to Database (using a transaction-like approach with Supabase)
            const workoutProgram = await this.saveWorkoutProgram(userId, aiProgram, prompt);

            return workoutProgram;
        } catch (error) {
            logger.error('Workout generation failed', { error, userId });
            if (error instanceof AppError) throw error;
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.WORKOUT_GENERATION_FAILED);
        }
    }

    /**
     * Get active workout program for a user
     */
    public async getActiveProgram(userId: string): Promise<any> {
        const { data: program, error } = await this.supabase
            .from('workout_programs')
            .select(`
                *,
                sessions:workout_sessions(
                    *,
                    exercises:session_exercises(*)
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }

        return program || null;
    }

    private constructWorkoutPrompt(user: any): string {
        const equipment = user.gym_access ? 'full gym access' : (user.home_equipment?.join(', ') || 'no equipment');
        const goals = user.fitness_goal;
        const level = user.experience_level;
        const history = user.injuries?.length ? `Note these injuries: ${user.injuries.join(', ')}` : 'No injuries reported.';

        const schedule = user.weekly_schedules
            .filter((s: WeeklySchedule) => s.available)
            .map((s: WeeklySchedule) => `Day ${s.day_of_week}: ${s.duration_minutes}min in the ${s.preferred_time}`)
            .join('\n');

        return `
            You are a master fitness coach. Generate a personalized 4-week workout program for a user with the following profile:
            - Goal: ${goals}
            - Experience Level: ${level}
            - Equipment Available: ${equipment}
            - Health History: ${history}
            - Weekly Availability: 
            ${schedule}

            RESPONSE FORMAT:
            You MUST return ONLY a valid JSON object with the following structure:
            {
                "name": "Program Name",
                "description": "Brief program description",
                "weekly_split": "Push/Pull/Legs, Full Body, etc.",
                "sessions": [
                    {
                        "day_of_week": number (0-6),
                        "session_name": "Chest & Triceps",
                        "session_type": "Hypertrophy/Strength/etc",
                        "estimated_duration_minutes": number,
                        "exercises": [
                            {
                                "exercise_name": "Bench Press",
                                "sets": number,
                                "reps": "string (e.g. 8-12)",
                                "rest_seconds": number,
                                "order_index": number,
                                "target_muscle": "Chest",
                                "notes": "Keep core tight"
                            }
                        ]
                    }
                ]
            }

            IMPORTANT:
            - Only include sessions for available days provided in the schedule.
            - Provide a balanced and safe program.
            - The JSON must be clean and parseable.
        `;
    }

    private parseAIResponse(text: string): AIWorkoutProgram {
        try {
            // Remove markdown code blocks if present
            const jsonStr = text.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error('Failed to parse AI response', { text });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Invalid AI response format');
        }
    }

    private async saveWorkoutProgram(userId: string, aiProgram: AIWorkoutProgram, prompt: string): Promise<WorkoutProgram> {
        // Create the program
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 28); // 4 weeks

        const { data: program, error: programError } = await this.supabase
            .from('workout_programs')
            .insert({
                user_id: userId,
                name: aiProgram.name,
                description: aiProgram.description,
                weekly_split: aiProgram.weekly_split,
                ai_generation_prompt: prompt,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active'
            })
            .select()
            .single();

        if (programError || !program) {
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Failed to save workout program');
        }

        // Create sessions and exercises
        for (const aiSession of aiProgram.sessions) {
            const { data: session, error: sessionError } = await this.supabase
                .from('workout_sessions')
                .insert({
                    program_id: program.id,
                    user_id: userId,
                    day_of_week: aiSession.day_of_week,
                    session_name: aiSession.session_name,
                    session_type: aiSession.session_type,
                    estimated_duration_minutes: aiSession.estimated_duration_minutes
                })
                .select()
                .single();

            if (sessionError || !session) continue;

            const sessionExercises = aiSession.exercises.map(ex => ({
                session_id: session.id,
                exercise_name: ex.exercise_name,
                target_muscle: ex.target_muscle,
                sets: ex.sets,
                reps: ex.reps,
                rest_seconds: ex.rest_seconds,
                order_index: ex.order_index,
                notes: ex.notes
            }));

            await this.supabase
                .from('session_exercises')
                .insert(sessionExercises);
        }

        return program;
    }
    /**
     * Log a completed workout session
     */
    public async logWorkoutSession(userId: string, data: {
        session_id: string;
        duration_minutes: number;
        exercises: {
            exercise_id: string;
            sets: {
                reps: number;
                weight: number;
                completed: boolean;
            }[];
        }[];
    }) {
        try {
            const { data: log, error } = await this.supabase
                .from('workout_logs')
                .insert({
                    user_id: userId,
                    session_id: data.session_id,
                    duration_minutes: data.duration_minutes,
                    completed_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error || !log) {
                logger.error('Failed to create workout log', { error });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao registrar treino');
            }

            // Save exercise logs
            const exerciseLogs = data.exercises.map(ex => ({
                log_id: log.id,
                exercise_id: ex.exercise_id,
                sets_data: ex.sets
            }));

            const { error: exError } = await this.supabase
                .from('exercise_logs')
                .insert(exerciseLogs);

            if (exError) {
                logger.error('Failed to save exercise logs', { exError });
            }

            return log;
        } catch (error) {
            logger.error('Workout logging error', { error, userId });
            if (error instanceof AppError) throw error;
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao registrar treino');
        }
    }
}

export default new WorkoutsService();

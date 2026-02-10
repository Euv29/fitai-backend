import axios from 'axios';
import { SupabaseClient } from '@supabase/supabase-js';
import databaseConfig from '../../config/database.config';
import { Exercise } from '../../shared/types/types';
import { AppError } from '../../shared/middleware/error.middleware';
import { ERROR_MESSAGES, HTTP_STATUS, EXERCISEDB_CONFIG } from '../../shared/constants/constants';
import logger from '../../shared/utils/logger.util';

class ExercisesService {
    private supabase: SupabaseClient;
    private apiKey: string | undefined;

    constructor() {
        this.supabase = databaseConfig.getClient();
        this.apiKey = process.env.RAPIDAPI_KEY;
    }

    /**
     * Search for exercises with filters
     */
    public async searchExercises(query: string, bodyPart?: string, equipment?: string): Promise<Exercise[]> {
        try {
            let dbQuery = this.supabase.from('exercises_cache').select('*');

            if (query) {
                dbQuery = dbQuery.ilike('name', `%${query}%`);
            }
            if (bodyPart) {
                dbQuery = dbQuery.eq('body_part', bodyPart);
            }
            if (equipment) {
                dbQuery = dbQuery.eq('equipment', equipment);
            }

            const { data, error } = await dbQuery.limit(50);

            if (error) {
                logger.error('Error fetching exercises from cache', { error });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            // If no results in cache and API key exists, we could fetch from API
            // For now, we rely on the cache which should be pre-populated or populated on demand
            if ((!data || data.length === 0) && this.apiKey && this.apiKey !== 'your-rapidapi-key-here') {
                return await this.fetchAndCacheFromAPI(query);
            }

            return (data || []) as Exercise[];
        } catch (error) {
            logger.error('Exercise search failed', { error });
            if (error instanceof AppError) throw error;
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    /**
     * Get exercise by ID
     */
    public async getExerciseById(id: string): Promise<Exercise> {
        const { data, error } = await this.supabase
            .from('exercises_cache')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            // Try API if not in cache
            if (this.apiKey && this.apiKey !== 'your-rapidapi-key-here') {
                return await this.fetchSingleFromAPI(id);
            }
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'Exercício não encontrado');
        }

        return data as Exercise;
    }

    private async fetchAndCacheFromAPI(query: string): Promise<Exercise[]> {
        try {
            const response = await axios.get(`${EXERCISEDB_CONFIG.BASE_URL}/exercises/name/${query}`, {
                headers: {
                    'X-RapidAPI-Key': this.apiKey,
                    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                }
            });

            const exercises = response.data;
            if (exercises && Array.isArray(exercises)) {
                await this.cacheExercises(exercises);
                return exercises as Exercise[];
            }
            return [];
        } catch (error) {
            logger.warn('Failed to fetch from ExerciseDB API', { error });
            return [];
        }
    }

    private async fetchSingleFromAPI(id: string): Promise<Exercise> {
        try {
            const response = await axios.get(`${EXERCISEDB_CONFIG.BASE_URL}/exercise/${id}`, {
                headers: {
                    'X-RapidAPI-Key': this.apiKey,
                    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                }
            });

            const exercise = response.data;
            if (exercise) {
                await this.cacheExercises([exercise]);
                return exercise as Exercise;
            }
            throw new Error('Not found');
        } catch (error) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'Exercício não encontrado');
        }
    }

    private async cacheExercises(exercises: any[]): Promise<void> {
        const cacheData = exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            body_part: ex.bodyPart,
            equipment: ex.equipment,
            gif_url: ex.gifUrl,
            target: ex.target,
            secondary_muscles: ex.secondaryMuscles,
            instructions: ex.instructions,
            cached_at: new Date().toISOString()
        }));

        await this.supabase
            .from('exercises_cache')
            .upsert(cacheData, { onConflict: 'id' });
    }
}

export default new ExercisesService();

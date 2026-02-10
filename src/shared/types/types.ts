// Shared TypeScript type definitions for FitAI backend

export interface User {
    id: string;
    phone: string;
    phone_country_code: string;
    name?: string;
    email?: string;
    age?: number;
    weight_kg?: number;
    height_cm?: number;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    fitness_goal?: 'lose_weight' | 'gain_muscle' | 'maintain' | 'endurance' | 'flexibility' | 'general_health';
    experience_level?: 'beginner' | 'intermediate' | 'advanced';
    activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    medical_conditions_encrypted?: string;
    injuries?: string[];
    gym_access?: boolean;
    home_equipment?: string[];
    preferred_language?: string;
    units?: 'metric' | 'imperial';
    notifications_enabled?: boolean;
    profile_completed?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface Subscription {
    id: string;
    user_id: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    plan: 'free_trial' | 'limited_free' | 'base' | 'pro' | 'unlimited';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    trial_ends_at?: Date;
    current_period_start?: Date;
    current_period_end?: Date;
    cancel_at_period_end?: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface WorkoutProgram {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    start_date: Date;
    end_date: Date;
    weekly_split?: string;
    ai_generation_prompt?: string;
    status?: 'active' | 'completed' | 'archived';
    created_at?: Date;
    updated_at?: Date;
}

export interface WorkoutSession {
    id: string;
    program_id: string;
    user_id: string;
    day_of_week?: number;
    session_name: string;
    session_type?: string;
    estimated_duration_minutes?: number;
    order_index?: number;
    created_at?: Date;
}

export interface Exercise {
    id: string;
    name: string;
    body_part?: string;
    equipment?: string;
    gif_url?: string;
    target?: string;
    secondary_muscles?: string[];
    instructions?: string[];
}

export interface SessionExercise {
    id: string;
    session_id: string;
    exercise_db_id?: string;
    exercise_name: string;
    exercise_type?: string;
    target_muscle?: string;
    equipment?: string;
    sets: number;
    reps: string;
    rest_seconds?: number;
    notes?: string;
    order_index?: number;
}

export interface Recipe {
    id: string;
    title: string;
    description?: string;
    category?: string;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    servings?: number;
    ingredients: { item: string; quantity: string; unit: string }[];
    instructions: string[];
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    tags?: string[];
    language?: string;
    ai_generated?: boolean;
}

export interface ChatMessage {
    id: string;
    user_id: string;
    message: string;
    role: 'user' | 'assistant';
    image_url?: string;
    image_analysis?: any;
    language?: string;
    created_at?: Date;
}

export interface UsageLimit {
    id: string;
    user_id: string;
    date: Date;
    ai_chat_count: number;
    recipe_generation_count: number;
    image_analysis_count: number;
}

export interface JWTPayload {
    userId: string;
    phone: string;
    plan?: string;
    iat?: number;
    exp?: number;
}

// Extend Express Request  to include user property
import { Request } from 'express';

export interface AuthRequest extends Request {
    user?: JWTPayload;
}

export interface SubscriptionLimits {
    ai_chat_limit: number;
    recipe_generation_limit: number;
    image_analysis_limit: number;
}

export interface WorkoutGenerationRequest {
    userId: string;
    regenerate?: boolean;
}

export interface ChatMessageRequest {
    message: string;
    language?: string;
}

export interface ImageAnalysisRequest {
    imageBase64: string;
    analysisType: 'food' | 'equipment' | 'form';
}

export interface RecipeGenerationRequest {
    category?: string;
    dietary_preferences?: string[];
    allergies?: string[];
    calorie_target?: number;
    cooking_time?: 'quick' | 'moderate' | 'elaborate';
}

export interface ExerciseLog {
    exercise_db_id?: string;
    exercise_name: string;
    sets_completed: number;
    actual_reps: number[];
    actual_weight_kg?: number[];
    difficulty_rating?: number;
    notes?: string;
    duration_seconds?: number;
}

export interface WorkoutCompletionRequest {
    session_id: string;
    duration_minutes: number;
    exercises: ExerciseLog[];
    notes?: string;
}

export interface SubscriptionCheckoutRequest {
    plan: 'base' | 'pro' | 'unlimited';
    success_url: string;
    cancel_url: string;
}

export interface WeeklySchedule {
    day_of_week: number;
    available: boolean;
    preferred_time?: 'morning' | 'afternoon' | 'evening';
    duration_minutes?: number;
}

export interface ProfileCompletionRequest {
    name: string;
    age: number;
    weight_kg: number;
    height_cm: number;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    fitness_goal: string;
    experience_level: string;
    activity_level: string;
    gym_access: boolean;
    home_equipment?: string[];
    medical_conditions?: string;
    injuries?: string[];
    weekly_schedule: WeeklySchedule[];
    preferred_language?: string;
    units?: 'metric' | 'imperial';
}

export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    details?: any;
}

export interface SuccessResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseConfig {
    private static instance: DatabaseConfig;
    public supabaseClient: SupabaseClient;
    public supabaseAdmin: SupabaseClient;

    private constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
            throw new Error('Missing required Supabase environment variables');
        }

        // Client for RLS-enabled operations (user context)
        this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

        // Admin client for service role operations (bypasses RLS)
        this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    public static getInstance(): DatabaseConfig {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }

    public getClient(): SupabaseClient {
        return this.supabaseClient;
    }

    public getAdminClient(): SupabaseClient {
        return this.supabaseAdmin;
    }
}

export default DatabaseConfig.getInstance();

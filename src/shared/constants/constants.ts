// Application constants

export const SUBSCRIPTION_LIMITS = {
    free_trial: {
        ai_chat_limit: 999999,
        recipe_generation_limit: 999999,
        image_analysis_limit: 999999,
    },
    limited_free: {
        ai_chat_limit: 3,
        recipe_generation_limit: 1,
        image_analysis_limit: 0,
    },
    base: {
        ai_chat_limit: 50,
        recipe_generation_limit: 10,
        image_analysis_limit: 5,
    },
    pro: {
        ai_chat_limit: 200,
        recipe_generation_limit: 999999,
        image_analysis_limit: 20,
    },
    unlimited: {
        ai_chat_limit: 999999,
        recipe_generation_limit: 999999,
        image_analysis_limit: 999999,
    },
};

export const TRIAL_DURATION_DAYS = 15;

export const ERROR_MESSAGES = {
    // Auth errors
    INVALID_PHONE: 'Número de telefone inválido',
    CODE_EXPIRED: 'Código expirado. Solicite um novo código.',
    CODE_INVALID: 'Código inválido',
    TOO_MANY_ATTEMPTS: 'Muitas tentativas. Solicite um novo código.',
    UNAUTHORIZED: 'Não autorizado',
    TOKEN_EXPIRED: 'Token expirado',
    TOKEN_INVALID: 'Token inválido',

    // User errors
    USER_NOT_FOUND: 'Usuário não encontrado',
    PROFILE_INCOMPLETE: 'Complete seu perfil primeiro',
    PROFILE_ALREADY_COMPLETE: 'Perfil já completo',

    // Subscription errors
    SUBSCRIPTION_NOT_FOUND: 'Assinatura não encontrada',
    TRIAL_EXPIRED: 'Período de teste expirado',
    USAGE_LIMIT_EXCEEDED: 'Limite de uso excedido',
    UPGRADE_REQUIRED: 'Upgrade necessário',

    // Workout errors
    WORKOUT_NOT_FOUND: 'Treino não encontrado',
    WORKOUT_GENERATION_FAILED: 'Falha ao gerar treino',
    NO_SCHEDULE_AVAILABLE: 'Nenhum horário disponível',

    // Recipe errors
    RECIPE_NOT_FOUND: 'Receita não encontrada',
    RECIPE_GENERATION_FAILED: 'Falha ao gerar receita',

    // General errors
    INTERNAL_ERROR: 'Erro interno do servidor',
    VALIDATION_ERROR: 'Erro de validação',
    RATE_LIMIT_EXCEEDED: 'Limite de requisições excedido',
    FILE_TOO_LARGE: 'Arquivo muito grande',
    INVALID_FILE_TYPE: 'Tipo de arquivo inválido',
};

export const SUCCESS_MESSAGES = {
    CODE_SENT: 'Código enviado com sucesso',
    LOGIN_SUCCESS: 'Login realizado com sucesso',
    PROFILE_UPDATED: 'Perfil atualizado com sucesso',
    WORKOUT_GENERATED: 'Treino gerado com sucesso',
    WORKOUT_LOGGED: 'Treino registrado com sucesso',
    RECIPE_SAVED: 'Receita salva com sucesso',
    SUBSCRIPTION_CREATED: 'Assinatura criada com sucesso',
    SUBSCRIPTION_UPDATED: 'Assinatura atualizada com sucesso',
    SUBSCRIPTION_CANCELED: 'Assinatura cancelada com sucesso',
};

export const REGEX_PATTERNS = {
    PHONE: /^\+?[1-9]\d{1,14}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CODE: /^\d{6}$/,
};

export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

export const DAYS_OF_WEEK = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
];

export const GEMINI_CONFIG = {
    TEXT_MODEL: 'gemini-1.5-pro',
    VISION_MODEL: 'gemini-1.5-pro-vision',
    TEMPERATURE: 0.7,
    MAX_OUTPUT_TOKENS: 2048,
    SAFETY_SETTINGS: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
    ],
};

export const EXERCISEDB_CONFIG = {
    BASE_URL: 'https://exercisedb.p.rapidapi.com',
    CACHE_DURATION_DAYS: 7,
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_ERROR: 500,
};

export const SUPPORTED_LANGUAGES = ['pt-BR', 'en-US', 'es-ES', 'fr-FR'];
export const DEFAULT_LANGUAGE = 'pt-BR';

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';
import logger from './shared/utils/logger.util';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes';
import workoutRoutes from './modules/workouts/workouts.routes';
import exerciseRoutes from './modules/exercises/exercises.routes';
import chatRoutes from './modules/chat/chat.routes';
import nutritionRoutes from './modules/nutrition/nutrition.routes';
import swaggerSpec from './config/swagger.config';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

// Security headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "cdnjs.cloudflare.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com", "cdn.tailwindcss.com"],
                fontSrc: ["'self'", "fonts.gstatic.com", "fonts.googleapis.com"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    })
);

// CORS
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:8081',
        process.env.ADMIN_URL || 'http://localhost:3001',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data
app.use(mongoSanitize());

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Muitas requisições deste IP. Tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
    message: 'Muitas tentativas de autenticação. Tente novamente mais tarde.',
    skipSuccessfulRequests: true,
});

app.use('/api/', generalLimiter);
app.use('/api/v1/auth/', authLimiter);

// Request logging
app.use((req: Request, _res: Response, next) => {
    logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    next();
});

// =====================================================
// ROUTES
// =====================================================

// Serve static documentation at root
app.use(express.static(path.join(__dirname, '../docs/public')));
app.use('/docs', express.static(path.join(__dirname, '../docs/public')));

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Docs path already handled above

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/workouts', workoutRoutes);
app.use('/api/v1/exercises', exerciseRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/nutrition', nutritionRoutes);

// Swagger JSON Spec
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    try {
        if (!swaggerSpec) {
            logger.error('Swagger Spec is undefined');
            return res.status(500).json({ error: 'Swagger Spec not loaded' });
        }
        logger.info(`Serving Swagger Spec: ${JSON.stringify(swaggerSpec.info)}`);
        res.send(swaggerSpec);
    } catch (error) {
        logger.error('Error serving Swagger Spec', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

// Only start server if run directly (not when imported by Vercel)
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`🚀 FitAI Backend running on port ${PORT}`);
        logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
    });
}


// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Rejection', { error: reason });
    // Close server & exit process
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
});

export default app;

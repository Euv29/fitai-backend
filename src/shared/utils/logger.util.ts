import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }

    if (stack) {
        msg += `\n${stack}`;
    }

    return msg;
});

// Define transports based on environment
const transports: winston.transport[] = [
    new winston.transports.Console({
        format: combine(
            colorize(),
            logFormat
        ),
    })
];

// Add file transports only in development
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports,
    // Only log exceptions to file in dev
    exceptionHandlers: process.env.NODE_ENV !== 'production' ? [
        new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
    ] : [],
    // Only log rejections to file in dev
    rejectionHandlers: process.env.NODE_ENV !== 'production' ? [
        new winston.transports.File({ filename: path.join('logs', 'rejections.log') })
    ] : [],
});

export default logger;

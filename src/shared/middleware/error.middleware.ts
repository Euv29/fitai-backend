import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types/types';
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants/constants';
import logger from '../utils/logger.util';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log error
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Default error response
    let errorResponse: ErrorResponse = {
        error: 'Internal Server Error',
        message: ERROR_MESSAGES.INTERNAL_ERROR,
        statusCode: HTTP_STATUS.INTERNAL_ERROR,
    };

    // Handle AppError instances
    if (err instanceof AppError) {
        errorResponse = {
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            details: err.details,
        };
    }

    // Handle Joi validation errors
    if (err.name === 'ValidationError') {
        errorResponse = {
            error: 'Validation Error',
            message: ERROR_MESSAGES.VALIDATION_ERROR,
            statusCode: HTTP_STATUS.BAD_REQUEST,
            details: err.message,
        };
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        errorResponse = {
            error: 'Invalid Token',
            message: ERROR_MESSAGES.TOKEN_INVALID,
            statusCode: HTTP_STATUS.UNAUTHORIZED,
        };
    }

    if (err.name === 'TokenExpiredError') {
        errorResponse = {
            error: 'Token Expired',
            message: ERROR_MESSAGES.TOKEN_EXPIRED,
            statusCode: HTTP_STATUS.UNAUTHORIZED,
        };
    }

    // Send error response
    res.status(errorResponse.statusCode).json(errorResponse);
};

export const notFoundHandler = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`,
        statusCode: HTTP_STATUS.NOT_FOUND,
    });
};

// Async error wrapper
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

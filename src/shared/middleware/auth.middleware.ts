import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, AuthRequest } from '../types/types';
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants/constants';
import logger from '../utils/logger.util';

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                error: 'Authentication required',
                message: ERROR_MESSAGES.UNAUTHORIZED,
            });
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }

        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                logger.warn('Token verification failed', { error: err.message });
                res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    error: 'Invalid token',
                    message: ERROR_MESSAGES.TOKEN_INVALID,
                });
                return;
            }

            (req as AuthRequest).user = decoded as JWTPayload;
            next();
        });
    } catch (error) {
        logger.error('Authentication middleware error', { error });
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            error: 'Authentication error',
            message: ERROR_MESSAGES.INTERNAL_ERROR,
        });
    }
};

export const optionalAuthentication = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            next();
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            next();
            return;
        }

        jwt.verify(token, secret, (err, decoded) => {
            if (!err && decoded) {
                (req as AuthRequest).user = decoded as JWTPayload;
            }
            next();
        });
    } catch (error) {
        logger.error('Optional authentication error', { error });
        next();
    }
};

export const refreshToken = (
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                error: 'Refresh token required',
                message: ERROR_MESSAGES.UNAUTHORIZED,
            });
            return;
        }

        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET not configured');
        }

        jwt.verify(refreshToken, secret, (err: any, decoded: any) => {
            if (err) {
                res.status(HTTP_STATUS.UNAUTHORIZED).json({
                    error: 'Invalid refresh token',
                    message: ERROR_MESSAGES.TOKEN_INVALID,
                });
                return;
            }

            const payload = decoded as JWTPayload;

            // Generate new access token
            const signOptions: jwt.SignOptions = {
                expiresIn: String(process.env.JWT_EXPIRES_IN || '15m') as any
            };
            const newToken = jwt.sign(
                { userId: payload.userId, phone: payload.phone },
                (process.env.JWT_SECRET as string),
                signOptions
            );

            res.json({
                success: true,
                data: { token: newToken },
            });
        });
    } catch (error) {
        logger.error('Token refresh error', { error });
        res.status(HTTP_STATUS.INTERNAL_ERROR).json({
            error: 'Token refresh failed',
            message: ERROR_MESSAGES.INTERNAL_ERROR,
        });
    }
};

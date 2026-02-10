import DatabaseConfig from '../../config/database.config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import { ERROR_MESSAGES, TRIAL_DURATION_DAYS, HTTP_STATUS } from '../../shared/constants/constants';
import { AppError } from '../../shared/middleware/error.middleware';
import logger from '../../shared/utils/logger.util';

export class AuthService {
    private db = DatabaseConfig.getAdminClient();

    // Generate 6-digit verification code
    private generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Send verification code via SMS
    async sendVerificationCode(phone: string, countryCode: string = '+351'): Promise<void> {
        try {
            // Check rate limiting - max 3 SMS per phone per hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const { data: recentCodes } = await this.db
                .from('verification_codes')
                .select('*')
                .eq('phone', phone)
                .gte('created_at', oneHourAgo.toISOString());

            if (recentCodes && recentCodes.length >= 3) {
                throw new AppError(
                    HTTP_STATUS.TOO_MANY_REQUESTS,
                    'Muitos pedidos de código. Tente novamente mais tarde.'
                );
            }

            const code = this.generateCode();
            const codeHash = await bcrypt.hash(code, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Save code to database
            const { error: insertError } = await this.db.from('verification_codes').insert({
                phone,
                code_hash: codeHash,
                expires_at: expiresAt.toISOString(),
                attempts: 0,
                verified: false,
            });

            if (insertError) {
                logger.error('Failed to save verification code', { error: insertError });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            // Send SMS via Twilio
            const sanitizedPhone = phone.startsWith('+') ? phone : `${countryCode}${phone}`;
            const message = `Seu código de verificação FitAI: ${code}`;

            try {
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                const fromPhone = process.env.TWILIO_PHONE_NUMBER;

                if (!accountSid || !authToken || !fromPhone) {
                    logger.warn('Twilio credentials missing, skipping SMS', { phone: sanitizedPhone });
                    // Still throw in production to avoid security bypass
                    if (process.env.NODE_ENV === 'production') {
                        throw new Error('SMS Gateway not configured');
                    }
                } else {
                    const client = twilio(accountSid, authToken);
                    await client.messages.create({
                        body: message,
                        from: fromPhone,
                        to: sanitizedPhone,
                    });
                    logger.info('Verification code sent via Twilio', { phone: sanitizedPhone });
                }
            } catch (smsError) {
                logger.error('Failed to send SMS', { error: smsError });
                // In development, log the code and continue without throwing
                if (process.env.NODE_ENV === 'development') {
                    logger.warn('Development mode - SMS failed, verification code:', { code, phone: sanitizedPhone });
                } else {
                    throw new AppError(
                        HTTP_STATUS.INTERNAL_ERROR,
                        'Falha ao enviar SMS. Tente novamente.'
                    );
                }
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Send verification code error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Verify code and login user
    async verifyCode(
        phone: string,
        code: string
    ): Promise<{ token: string; refreshToken: string; isNewUser: boolean }> {
        try {
            // Get latest unverified code for this phone
            const { data: verificationData, error: fetchError } = await this.db
                .from('verification_codes')
                .select('*')
                .eq('phone', phone)
                .eq('verified', false)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError || !verificationData) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CODE_EXPIRED);
            }

            // Verify code
            const isValid = await bcrypt.compare(code, verificationData.code_hash);

            if (!isValid) {
                // Increment attempts
                const newAttempts = verificationData.attempts + 1;
                await this.db
                    .from('verification_codes')
                    .update({ attempts: newAttempts })
                    .eq('id', verificationData.id);

                if (newAttempts >= 5) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.TOO_MANY_ATTEMPTS);
                }

                throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CODE_INVALID);
            }

            // Mark code as verified
            await this.db
                .from('verification_codes')
                .update({ verified: true })
                .eq('id', verificationData.id);

            // Check if user exists
            let { data: user } = await this.db
                .from('users')
                .select('*')
                .eq('phone', phone)
                .single();

            let isNewUser = false;

            if (!user) {
                // Create new user
                const { data: newUser, error: createError } = await this.db
                    .from('users')
                    .insert({
                        phone,
                        phone_country_code: '+351',
                        preferred_language: 'pt-BR',
                        units: 'metric',
                        profile_completed: false,
                    })
                    .select()
                    .single();

                if (createError || !newUser) {
                    logger.error('Failed to create user', { error: createError });
                    throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
                }

                user = newUser;
                isNewUser = true;

                // Create trial subscription
                const trialEndsAt = new Date(
                    Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000
                );

                const { error: subError } = await this.db.from('subscriptions').insert({
                    user_id: user.id,
                    plan: 'free_trial',
                    status: 'trialing',
                    trial_ends_at: trialEndsAt.toISOString(),
                    current_period_start: new Date().toISOString(),
                    current_period_end: trialEndsAt.toISOString(),
                });

                if (subError) {
                    logger.error('Failed to create subscription', { error: subError });
                }

                logger.info('New user created with trial subscription', { userId: user.id });
            }

            // Generate JWT tokens
            const jwtSecret = process.env.JWT_SECRET as string;
            const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;

            if (!jwtSecret || !jwtRefreshSecret) {
                throw new Error('JWT secrets not configured');
            }

            const token = jwt.sign(
                { userId: user.id, phone: user.phone },
                jwtSecret,
                { expiresIn: String(process.env.JWT_EXPIRES_IN || '15m') as any }
            );

            const refreshToken = jwt.sign(
                { userId: user.id },
                jwtRefreshSecret,
                { expiresIn: String(process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
            );

            return { token, refreshToken, isNewUser };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Verify code error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }
}

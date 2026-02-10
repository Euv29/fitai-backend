import DatabaseConfig from '../../config/database.config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import twilio from 'twilio';
import { ERROR_MESSAGES, TRIAL_DURATION_DAYS, HTTP_STATUS } from '../../shared/constants/constants';
import { AppError } from '../../shared/middleware/error.middleware';
import logger from '../../shared/utils/logger.util';
import { EmailService } from '../../services/email.service';

export class AuthService {
    private db = DatabaseConfig.getAdminClient();
    private emailService = new EmailService();

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

    // Send verification code via Email
    async sendEmailVerificationCode(email: string): Promise<void> {
        try {
            // Check rate limiting
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const { data: recentCodes } = await this.db
                .from('verification_codes')
                .select('*')
                .eq('email', email)
                .gte('created_at', oneHourAgo.toISOString());

            if (recentCodes && recentCodes.length >= 5) {
                throw new AppError(
                    HTTP_STATUS.TOO_MANY_REQUESTS,
                    'Muitos pedidos de código. Tente novamente mais tarde.'
                );
            }

            const code = this.generateCode();
            const codeHash = await bcrypt.hash(code, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            const { error: insertError } = await this.db.from('verification_codes').insert({
                email,
                code_hash: codeHash,
                expires_at: expiresAt.toISOString(),
                attempts: 0,
                verified: false,
            });

            if (insertError) {
                logger.error('Failed to save email verification code', { error: insertError });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            await this.emailService.sendVerificationCode(email, code);
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Send email verification code error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Sign up with Email
    async signUpEmail(email: string, password: string): Promise<void> {
        try {
            // Check if user exists
            const { data: existingUser } = await this.db
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (existingUser) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'E-mail já cadastrado.');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const { error: createError } = await this.db.from('users').insert({
                email,
                password_hash: passwordHash,
                email_verified: false,
                preferred_language: 'pt-BR',
                units: 'metric',
                profile_completed: false,
            });

            if (createError) {
                logger.error('Failed to create user with email', { error: createError });
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
            }

            // Send verification code
            await this.sendEmailVerificationCode(email);
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Sign up email error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Verify Email Code
    async verifyEmail(email: string, code: string): Promise<{ token: string; refreshToken: string; isNewUser: boolean }> {
        try {
            const { data: verificationData, error: fetchError } = await this.db
                .from('verification_codes')
                .select('*')
                .eq('email', email)
                .eq('verified', false)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError || !verificationData) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CODE_EXPIRED);
            }

            const isValid = await bcrypt.compare(code, verificationData.code_hash);

            if (!isValid) {
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

            await this.db
                .from('verification_codes')
                .update({ verified: true })
                .eq('id', verificationData.id);

            // Mark email as verified
            const { data: user, error: userError } = await this.db
                .from('users')
                .update({ email_verified: true })
                .eq('email', email)
                .select()
                .single();

            if (userError || !user) {
                throw new AppError(HTTP_STATUS.INTERNAL_ERROR, 'Falha ao verificar usuário.');
            }

            // Create subscription if needed (logic similar to phone auth)
            // Check subscription
            const { data: subscription } = await this.db
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!subscription) {
                const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
                await this.db.from('subscriptions').insert({
                    user_id: user.id,
                    plan: 'free_trial',
                    status: 'trialing',
                    trial_ends_at: trialEndsAt.toISOString(),
                    current_period_start: new Date().toISOString(),
                    current_period_end: trialEndsAt.toISOString(),
                });
            }

            return this.generateTokens(user);

        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Verify email error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Login with Email
    async loginEmail(email: string, password: string): Promise<{ token: string; refreshToken: string }> {
        try {
            const { data: user } = await this.db
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (!user || !user.password_hash) {
                throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Credenciais inválidas.');
            }

            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Credenciais inválidas.');
            }

            if (!user.email_verified) {
                // Should we resend code here? Maybe just tell them to verify.
                // Or auto-send code if checking verify logic
                throw new AppError(HTTP_STATUS.FORBIDDEN, 'E-mail não verificado.');
            }

            return this.generateTokens(user);
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Login email error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Forgot Password
    async forgotPassword(email: string): Promise<void> {
        try {
            const { data: user } = await this.db
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (!user) {
                // Don't reveal user existence
                return;
            }

            const code = this.generateCode();
            const codeHash = await bcrypt.hash(code, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            // Reuse verification_codes (or create a separate table if preferred, but reusing is fine for now if we track purpose)
            // Ideally should track type 'RESET_PASSWORD', but for now assume generic code
            // Actually, let's just use verification_codes and in resetPassword check logic
            // BUT verification_codes doesn't have a 'type'.
            // For simplicity in this iteration, we treat it same as verification code or add a type?
            // Let's assume verification_codes is multipurpose for now, or just use it.
            // Since `verifyEmail` checks `verified=false`, and `resetPassword` will do the same.

            await this.db.from('verification_codes').insert({
                email,
                code_hash: codeHash,
                expires_at: expiresAt.toISOString(),
                attempts: 0,
                verified: false
            });

            await this.emailService.sendPasswordResetCode(email, code);
        } catch (error) {
            logger.error('Forgot password error', { error });
            // Don't throw to avoid user enumeration? Or throw generic.
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Reset Password
    async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
        try {
            const { data: verificationData, error: fetchError } = await this.db
                .from('verification_codes')
                .select('*')
                .eq('email', email)
                .eq('verified', false)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError || !verificationData) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CODE_EXPIRED);
            }

            const isValid = await bcrypt.compare(code, verificationData.code_hash);
            if (!isValid) {
                await this.db
                    .from('verification_codes')
                    .update({ attempts: verificationData.attempts + 1 })
                    .eq('id', verificationData.id);
                throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.CODE_INVALID);
            }

            await this.db
                .from('verification_codes')
                .update({ verified: true })
                .eq('id', verificationData.id);

            const passwordHash = await bcrypt.hash(newPassword, 10);

            await this.db
                .from('users')
                .update({ password_hash: passwordHash })
                .eq('email', email);

        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Reset password error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }

    // Helper for tokens
    private generateTokens(user: any): { token: string; refreshToken: string; isNewUser: boolean } {
        const jwtSecret = process.env.JWT_SECRET as string;
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;

        if (!jwtSecret || !jwtRefreshSecret) {
            throw new Error('JWT secrets not configured');
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, phone: user.phone },
            jwtSecret,
            { expiresIn: String(process.env.JWT_EXPIRES_IN || '15m') as any }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            jwtRefreshSecret,
            { expiresIn: String(process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
        );

        const isNewUser = !user.profile_completed;
        return { token, refreshToken, isNewUser };
    }

    // Verify code and login user (Phone)
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

            return this.generateTokens(user);
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Verify code error', { error });
            throw new AppError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
        }
    }
}

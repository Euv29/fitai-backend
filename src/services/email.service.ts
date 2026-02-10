import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendVerificationCode(email: string, code: string): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"FitAI" <no-reply@fitai.com>',
                to: email,
                subject: 'FitAI - Código de Verificação',
                text: `Seu código de verificação é: ${code}. Este código expira em 10 minutos.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0ea5e9;">Verificação de E-mail FitAI</h2>
                        <p>Olá,</p>
                        <p>Use o código abaixo para verificar sua conta:</p>
                        <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #18181b;">${code}</span>
                        </div>
                        <p>Este código expira em 10 minutos.</p>
                        <p style="color: #71717a; font-size: 12px; margin-top: 30px;">Se você não solicitou este código, ignore este e-mail.</p>
                    </div>
                `,
            });
            logger.info(`Email sent: ${info.messageId}`);
        } catch (error) {
            logger.error('Error sending verification email', error);
            throw new Error('Failed to send verification email');
        }
    }

    async sendPasswordResetCode(email: string, code: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"FitAI" <no-reply@fitai.com>',
                to: email,
                subject: 'FitAI - Recuperação de Senha',
                text: `Seu código para redefinir a senha é: ${code}.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0ea5e9;">Recuperação de Senha</h2>
                        <p>Recebemos uma solicitação para redefinir sua senha.</p>
                        <p>Use o código abaixo para prosseguir:</p>
                        <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #18181b;">${code}</span>
                        </div>
                        <p>Se não foi você, recomendamos alterar sua senha ou contatar o suporte.</p>
                    </div>
                `,
            });
            logger.info(`Password reset email sent to ${email}`);
        } catch (error) {
            logger.error('Error sending password reset email', error);
            throw new Error('Failed to send password reset email');
        }
    }
}

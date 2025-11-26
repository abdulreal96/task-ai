import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured - email sending will fail');
    }
    
    this.resend = new Resend(apiKey);
  }

  async sendOTP(email: string, otp: string, fullName: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Task AI <onboarding@resend.dev>', // Use Resend's test domain or your verified domain
        to: [email],
        subject: 'Verify Your Email - Task AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hello ${fullName}!</h2>
            <p>Thank you for signing up for Task AI. Please use the following code to verify your email address:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send OTP email: ${error.message}`, error);
        throw new Error('Failed to send verification email');
      }

      this.logger.log(`OTP email sent successfully to ${email}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error('Error sending OTP email', error);
      throw error;
    }
  }

  async sendPasswordResetOTP(email: string, otp: string, fullName: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Task AI <onboarding@resend.dev>',
        to: [email],
        subject: 'Reset Your Password - Task AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Hello ${fullName}!</h2>
            <p>You requested to reset your password for Task AI. Use the following code to reset your password:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p><strong>If you didn't request a password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send password reset email: ${error.message}`, error);
        throw new Error('Failed to send password reset email');
      }

      this.logger.log(`Password reset email sent successfully to ${email}, ID: ${data?.id}`);
    } catch (error) {
      this.logger.error('Error sending password reset email', error);
      throw error;
    }
  }
}

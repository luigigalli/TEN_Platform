import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { WelcomeEmail } from '../emails/WelcomeEmail';
import { VerificationEmail } from '../emails/VerificationEmail';
import { ResetPasswordEmail } from '../emails/ResetPasswordEmail';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        ...options,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const html = render(WelcomeEmail({ name }));
    await this.sendEmail({
      to,
      subject: 'Welcome to TEN2!',
      html,
    });
  }

  async sendVerificationEmail(to: string, name: string, code: string): Promise<void> {
    const html = render(VerificationEmail({ name, code }));
    await this.sendEmail({
      to,
      subject: 'Verify your email address',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<void> {
    const html = render(ResetPasswordEmail({ name, resetLink }));
    await this.sendEmail({
      to,
      subject: 'Reset your password',
      html,
    });
  }
}

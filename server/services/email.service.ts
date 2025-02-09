import nodemailer from "nodemailer";
import { env } from "../config/environment";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (env.NODE_ENV !== "production") {
      // Use ethereal email for development
      this.setupDevTransporter();
    } else {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: true,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  private async setupDevTransporter() {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    // Create a testing transporter
    this.transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  async sendEmail({ to, subject, html }: EmailOptions) {
    try {
      const info = await this.transporter.sendMail({
        from: `"TEN Platform" <${env.NODE_ENV === "production" ? env.SMTP_FROM : "noreply@tenplatform.com"}>`,
        to,
        subject,
        html,
      });

      if (env.NODE_ENV !== "production") {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }

      return info;
    } catch (error) {
      console.error("Failed to send email:", error);
      // Don't throw in development, just log the error
      if (env.NODE_ENV === "production") {
        throw error;
      }
      return null;
    }
  }
}

export const emailService = new EmailService();

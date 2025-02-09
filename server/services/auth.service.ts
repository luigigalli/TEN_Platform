import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuthError } from '../errors';
import { emailService } from './email.service';
import { randomBytes } from 'crypto';
import { env } from '../config/environment';
import { emailTemplates } from "./email-templates";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

export class AuthService {
  private static readonly JWT_SECRET = env.JWT_SECRET || 'development-secret-key';
  private static readonly JWT_EXPIRES_IN = '24h';

  private static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new AuthError('Invalid or expired token');
    }
  }

  private static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private static async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    console.log('[Auth] Comparing password with hash:', { hashedPassword });
    return bcrypt.compare(password, hashedPassword);
  }

  private static generateVerificationToken(): string {
    return randomBytes(32).toString("hex");
  }

  private static generatePasswordResetToken(): string {
    return randomBytes(32).toString("hex");
  }

  static async login({ email, password }: LoginCredentials) {
    console.log('[Auth] Login attempt for:', email);
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    console.log('[Auth] User found:', user ? 'yes' : 'no');

    if (!user) {
      throw new AuthError("Invalid credentials");
    }

    console.log('[Auth] Email verified:', user.emailVerified);

    if (!user.emailVerified) {
      throw new AuthError("Please verify your email before logging in");
    }

    console.log('[Auth] Comparing passwords...');
    const isValidPassword = await this.comparePasswords(password, user.password);
    console.log('[Auth] Password valid:', isValidPassword);

    if (!isValidPassword) {
      throw new AuthError("Invalid credentials");
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    return { token, user };
  }

  static async register(data: RegisterData) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      throw new AuthError("Email already registered");
    }

    const verificationToken = this.generateVerificationToken();
    const hashedPassword = await this.hashPassword(data.password);

    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || "USER",
        verificationToken,
        emailVerified: false,
        active: true
      })
      .returning();

    await this.sendVerificationEmail(user.email, verificationToken);

    return { user, verificationToken };
  }

  static async verifyEmail(token: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.verificationToken, token),
    });

    if (!user) {
      throw new AuthError("Invalid verification token");
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { message: "Email verified successfully" };
  }

  static async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
    
    await emailService.sendEmail({
      to: email,
      subject: "Verify your email - TEN Platform",
      html: emailTemplates.verifyEmail({ verificationUrl }),
    });
  }

  static async requestPasswordReset(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: "If your email is registered, you will receive a password reset link" };
    }

    const resetToken = this.generatePasswordResetToken();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db
      .update(users)
      .set({
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    await emailService.sendEmail({
      to: email,
      subject: "Reset your password - TEN Platform",
      html: emailTemplates.resetPassword({ resetUrl }),
    });

    return { message: "If your email is registered, you will receive a password reset link" };
  }

  static async resetPassword(token: string, newPassword: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });

    if (!user || !user.resetTokenExpiry) {
      throw new AuthError("Invalid or expired reset token");
    }

    if (new Date() > user.resetTokenExpiry) {
      throw new AuthError("Reset token has expired");
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { message: "Password reset successfully" };
  }

  static async updateProfile(userId: string, data: Partial<RegisterData>) {
    const updates: any = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.password) {
      updates.password = await this.hashPassword(data.password);
      delete updates.password;
    }

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    return { user };
  }

  static async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new AuthError("User not found");
    }

    const isValidPassword = await this.comparePasswords(
      oldPassword,
      user.password
    );

    if (!isValidPassword) {
      throw new AuthError("Current password is incorrect");
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { message: "Password changed successfully" };
  }

  static async refreshToken(token: string) {
    const payload = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    
    // Check if user still exists and is active
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId)
    });

    if (!user || !user.active) {
      throw new AuthError('User not found or inactive');
    }

    // Generate new token
    const newToken = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    });

    return { token: newToken };
  }
}

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import { generateToken, verifyToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm/sql';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
    async register(userData: typeof users.$inferInsert): Promise<{ user: typeof users.$inferSelect; tokens: { accessToken: string; refreshToken: string } }> {
        // Check if user exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, userData.email)
        });

        if (existingUser) {
            throw new BadRequestError('Email already registered');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create new user
        const newUser = await db.insert(users).values({
            ...userData,
            password: hashedPassword,
            status: 'active'
        }).returning();

        // Generate tokens
        const tokens = await this.generateAuthTokens(newUser[0]);

        return { user: newUser[0], tokens };
    }

    async login(identifier: string, password: string): Promise<{ user: typeof users.$inferSelect; tokens: { accessToken: string; refreshToken: string } }> {
        console.log('Login attempt:', { identifier });
        
        const user = await db.query.users.findFirst({
            where: (users) => sql`${users.email} = ${identifier} OR ${users.username} = ${identifier}`,
            with: {
                roles: {
                    with: {
                        role: {
                            with: {
                                permissions: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log('User not found:', identifier);
            throw new NotFoundError('User not found');
        }

        console.log('Found user:', { 
            id: user.id, 
            username: user.username,
            hashedPassword: user.password?.substring(0, 20) + '...',
        });

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password validation:', { isValid: isValidPassword });
        
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials');
        }

        if (user.status !== 'active') {
            throw new UnauthorizedError('Account is not active');
        }

        // Generate tokens
        const tokens = await this.generateAuthTokens(user);

        return { user, tokens };
    }

    async loginWithGoogle(idToken: string): Promise<{ user: typeof users.$inferSelect; tokens: { accessToken: string; refreshToken: string } }> {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            if (!payload?.email) {
                throw new BadRequestError('Invalid Google token');
            }

            let user = await db.query.users.findFirst({
                where: eq(users.email, payload.email)
            });

            if (!user) {
                // Create new user from Google data
                const [newUser] = await db.insert(users).values({
                    email: payload.email,
                    username: payload.email.split('@')[0],
                    fname: payload.given_name || '',
                    lname: payload.family_name || '',
                    status: 'active',
                    password: await bcrypt.hash(randomBytes(32).toString('hex'), 10)
                }).returning();
                user = newUser;
            }

            const tokens = await this.generateAuthTokens(user);
            return { user, tokens };
        } catch (error) {
            console.error('Google login error:', error);
            throw new UnauthorizedError('Failed to authenticate with Google');
        }
    }

    private async generateAuthTokens(user: typeof users.$inferSelect): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = generateToken(
            { userId: user.id, type: 'access' },
            '15m'
        );

        const refreshToken = generateToken(
            { userId: user.id, type: 'refresh' },
            '7d'
        );

        // Store refresh token in database
        await db.update(users)
            .set({ refreshToken })
            .where(eq(users.id, user.id));

        return { accessToken, refreshToken };
    }

    async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const decoded = verifyToken(token);
            if (decoded.type !== 'refresh') {
                throw new UnauthorizedError('Invalid token type');
            }

            const user = await db.query.users.findFirst({
                where: eq(users.id, decoded.userId)
            });

            if (!user || user.refreshToken !== token) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            return this.generateAuthTokens(user);
        } catch (error) {
            throw new UnauthorizedError('Invalid refresh token');
        }
    }

    async logout(refreshToken: string): Promise<void> {
        const user = await db.query.users.findFirst({
            where: eq(users.refreshToken, refreshToken)
        });

        if (user) {
            await db.update(users)
                .set({ refreshToken: null })
                .where(eq(users.id, user.id));
        }
    }
}

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([
    'admin', 
    'editor', 
    'customer_support', 
    'local_expert', 
    'activity_supplier', 
    'accommodation_supplier', 
    'customer'
  ]).default('customer')
});

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      // Validate request body
      const credentials = loginSchema.parse(req.body);
      
      // Attempt login
      const result = await AuthService.login(credentials);
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
      }
    }
  }

  static async register(req: Request, res: Response) {
    try {
      // Validate request body
      const userData = registerSchema.parse(req.body);
      
      // Register user
      const result = await AuthService.register(userData);
      
      // TODO: Send verification email
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
      }
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const result = await AuthService.refreshToken(token);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : 'Token refresh failed' });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        console.error('[Auth] /me: No user in request');
        return res.status(401).json({ error: 'Not authenticated' });
      }

      console.log('[Auth] /me: Looking up user with ID:', req.user.userId);
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.userId)
      });

      if (!user) {
        console.error('[Auth] /me: No user found with ID:', req.user.userId);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('[Auth] /me: Found user:', { id: user.id, email: user.email, role: user.role });
      
      // Remove sensitive data
      const { password, verificationToken, resetPasswordToken, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error('[Auth] Error in /me endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  }
}

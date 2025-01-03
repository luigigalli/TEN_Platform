import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

export const userRoutes = Router();

// Mock user data for testing
const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  created_at: new Date(),
  role: 'user'
};

const validCredentials = {
  email: 'test@example.com',
  password: 'password123'
};

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get current authenticated user
 *     description: Returns the currently authenticated user's information or null if not authenticated
 *     tags: [User]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: 'null'
 *             examples:
 *               authenticated:
 *                 value:
 *                   id: 1
 *                   name: "Test User"
 *                   email: "test@example.com"
 *                   created_at: "2025-01-03T12:00:00.000Z"
 *                   role: "user"
 *               unauthenticated:
 *                 value: null
 */
userRoutes.get('/', (req, res) => {
  // Check for session cookie
  const hasSession = req.cookies.session === 'mock-session-id';

  if (hasSession) {
    return res.json(mockUser);
  }

  res.json(null);
});

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Authenticate user
 *     description: Log in a user with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *           example:
 *             email: "test@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               ok: true
 *               message: "Login successful"
 *               user:
 *                 id: 1
 *                 name: "Test User"
 *                 email: "test@example.com"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               ok: false
 *               message: "Email and password are required"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               ok: false
 *               message: "Invalid email or password"
 */
userRoutes.post('/login', async (req, res, next) => {
  try {
    console.log('\n[BACKEND] Login attempt at /api/user/login');
    console.log('[BACKEND] Request:', {
      body: req.body,
      method: req.method,
      path: req.path,
      headers: req.headers
    });

    const { email, password } = req.body;

    // Log parsed credentials (safely)
    console.log('[BACKEND] Parsed credentials:', {
      email,
      hasPassword: !!password
    });

    // Validate credentials
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'Email and password are required'
      });
    }

    // Check against mock credentials
    if (email !== validCredentials.email || password !== validCredentials.password) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid email or password'
      });
    }

    // Set session cookie
    res.cookie('session', 'mock-session-id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('[BACKEND] Login successful');
    const response = {
      ok: true,
      message: 'Login successful',
      user: mockUser
    };
    console.log('[BACKEND] Sending response:', response);

    res.json(response);
  } catch (err) {
    console.error('[BACKEND] Login error:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register new user
 *     description: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *           example:
 *             email: "newuser@example.com"
 *             password: "securepassword123"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               ok: true
 *               message: "Registration successful"
 *               user:
 *                 id: 1
 *                 name: "New User"
 *                 email: "newuser@example.com"
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               ok: false
 *               message: "Email already registered"
 */
userRoutes.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Check if email is already taken (mock validation)
  if (email === mockUser.email) {
    return res.status(400).json({
      ok: false,
      message: 'Email already registered'
    });
  }

  // In a real app, we would hash the password and save to DB
  res.status(201).json({
    ok: true,
    message: 'Registration successful',
    user: {
      ...mockUser,
      email,
      created_at: new Date()
    }
  });
});

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout the current user and clear their session
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             example:
 *               ok: true
 *               message: "Logout successful"
 */
userRoutes.post('/logout', (req, res) => {
  // Clear the session cookie
  res.clearCookie('session');

  res.json({
    ok: true,
    message: 'Logout successful'
  });
});
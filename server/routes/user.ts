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

// Get current user
userRoutes.get('/', (req, res) => {
  // Check for session cookie
  const hasSession = req.cookies.session === 'mock-session-id';
  
  if (hasSession) {
    return res.json(mockUser);
  }
  
  res.json(null);
});

// Login
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

// Register
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

// Logout
userRoutes.post('/logout', (req, res) => {
  // Clear the session cookie
  res.clearCookie('session');
  
  res.json({
    ok: true,
    message: 'Logout successful'
  });
});

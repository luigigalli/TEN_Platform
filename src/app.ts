import express from 'express';
import { json } from 'express';
import { setupErrorHandling } from './middleware/error';
import { rbacMiddleware } from './middleware/rbac';
import { AuthService } from './services/auth.service';

const app = express();
const port = process.env.PORT || 3000;
const authService = new AuthService();

// Middleware
app.use(json());
app.use(rbacMiddleware);

// Auth routes
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Protected route example
app.get('/api/protected', (_req, res) => {
  res.json({ message: 'Access granted' });
});

// Admin route example
app.get('/api/admin', (_req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Set up error handling last
setupErrorHandling(app);

app.listen(port, () => {
  console.info(`Server started on port ${port}`);
});

export { app };

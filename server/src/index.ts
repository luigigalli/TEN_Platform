import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { AppDataSource } from './data-source';
import { userRoutes } from './routes/users';

// Load environment variables
config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Initialize TypeORM connection
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    
    // Start server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });

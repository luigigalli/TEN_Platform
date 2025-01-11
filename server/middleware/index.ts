import { type Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

export function setupMiddleware(app: Express): void {
  // Security middleware
  app.use(helmet());
  
  // CORS middleware
  app.use(cors());
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}

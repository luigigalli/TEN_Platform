import express from "express";
import { userRoutes } from "./routes/user";

// Ensure the function is properly exported
export const registerRoutes = (app: express.Application): void => {
	app.use('/api/user', userRoutes);
};
import { Request, Response, NextFunction } from 'express';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { validateDto, validateQuery, rules } from '../middleware/validation.middleware';

export class UserController {
  /**
   * Example route with DTO validation
   */
  static createUser = [
    validateDto(CreateUserDto),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // At this point, req.body is validated and typed as CreateUserDto
        const userData = req.body;
        
        // Process the validated data...
        res.status(201).json({ message: 'User created', data: userData });
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Example route with query parameter validation
   */
  static getUsers = [
    validateQuery({
      page: rules.min(1),
      limit: (value) => (
        Number(value) >= 1 && Number(value) <= 100 || 
        'Limit must be between 1 and 100'
      ),
      sort: (value) => (
        ['asc', 'desc'].includes(String(value)) || 
        'Sort must be either asc or desc'
      )
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { page, limit, sort } = req.query;
        
        // Process the validated query parameters...
        res.json({ 
          message: 'Users retrieved',
          params: { page, limit, sort }
        });
      } catch (error) {
        next(error);
      }
    }
  ];

  /**
   * Example route with partial DTO validation
   */
  static updateUser = [
    validateDto(UpdateUserDto, true), // Skip missing properties
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userData = req.body;
        const userId = req.params.id;
        
        // Process the validated update data...
        res.json({ 
          message: 'User updated',
          id: userId,
          data: userData
        });
      } catch (error) {
        next(error);
      }
    }
  ];
}

import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ValidationError as AppValidationError } from '../errors/types';

/**
 * Validation middleware factory
 * @param type - The DTO class to validate against
 * @param skipMissingProperties - Whether to skip validation of missing properties
 */
export function validateDto(type: any, skipMissingProperties = false) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const dtoObj = plainToInstance(type, req.body);
    const errors = await validate(dtoObj, { skipMissingProperties });

    if (errors.length > 0) {
      const validationErrors = formatValidationErrors(errors);
      next(new AppValidationError('Validation failed', { errors: validationErrors }));
    } else {
      req.body = dtoObj;
      next();
    }
  };
}

/**
 * Format class-validator errors into a more readable structure
 */
function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  return errors.reduce((acc, error) => {
    const constraints = error.constraints || {};
    acc[error.property] = Object.values(constraints);
    return acc;
  }, {} as Record<string, string[]>);
}

/**
 * Query parameter validation middleware
 * @param schema - Validation schema for query parameters
 */
export function validateQuery(schema: Record<string, (value: any) => boolean | string>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: Record<string, string[]> = {};

    for (const [param, validator] of Object.entries(schema)) {
      const value = req.query[param];
      const result = validator(value);

      if (typeof result === 'string') {
        errors[param] = [result];
      } else if (!result) {
        errors[param] = [`Invalid value for parameter: ${param}`];
      }
    }

    if (Object.keys(errors).length > 0) {
      next(new AppValidationError('Query validation failed', { errors }));
    } else {
      next();
    }
  };
}

/**
 * Common validation rules
 */
export const rules = {
  required: (value: any) => !!value || 'This field is required',
  min: (min: number) => (value: number) => 
    value >= min || `Value must be greater than or equal to ${min}`,
  max: (max: number) => (value: number) => 
    value <= max || `Value must be less than or equal to ${max}`,
  minLength: (min: number) => (value: string) => 
    value.length >= min || `Must be at least ${min} characters long`,
  maxLength: (max: number) => (value: string) => 
    value.length <= max || `Must be at most ${max} characters long`,
  pattern: (regex: RegExp, message: string) => (value: string) => 
    regex.test(value) || message,
  email: (value: string) => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email address',
  url: (value: string) => 
    /^https?:\/\/.+\..+/.test(value) || 'Invalid URL',
};

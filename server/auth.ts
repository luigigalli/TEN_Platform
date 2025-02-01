import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq, or } from "drizzle-orm";
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";

const scryptAsync = promisify(scrypt);

// Custom error class for authentication-related errors
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const registrationResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    role: z.string(),
  }).optional(),
});

type LoginData = z.infer<typeof loginSchema>;
type RegistrationResponse = z.infer<typeof registrationResponseSchema>;

// Extend Express User interface with our SelectUser type
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Type-safe crypto utilities
const crypto = {
  /**
   * Hash a password with a random salt
   * @param password - The password to hash
   * @returns A promise that resolves to the hashed password with salt
   * @throws {AuthError} If the password is invalid or hashing fails
   */
  hash: async (password: string): Promise<string> => {
    try {
      if (!password) {
        throw new AuthError(
          "Password is required",
          "MISSING_PASSWORD",
          400
        );
      }

      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      return `${buf.toString("hex")}.${salt}`;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        "Password hashing failed",
        "HASH_FAILED",
        500,
        error
      );
    }
  },

  /**
   * Compare a supplied password with a stored password hash
   * @param suppliedPassword - The password to check
   * @param storedPassword - The stored password hash to compare against
   * @returns A promise that resolves to true if the passwords match
   * @throws {AuthError} If the password comparison fails
   */
  compare: async (suppliedPassword: string, storedPassword: string): Promise<boolean> => {
    try {
      if (!suppliedPassword || !storedPassword) {
        throw new AuthError(
          "Both passwords are required for comparison",
          "MISSING_PASSWORDS",
          400
        );
      }

      const [hashedPassword, salt] = storedPassword.split(".");
      if (!hashedPassword || !salt) {
        throw new AuthError(
          "Invalid stored password format",
          "INVALID_PASSWORD_FORMAT",
          400
        );
      }

      const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
      const suppliedPasswordBuf = (await scryptAsync(
        suppliedPassword,
        salt,
        64
      )) as Buffer;

      return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        "Password comparison failed",
        "COMPARISON_FAILED",
        500,
        error
      );
    }
  },
};

// Middleware to ensure user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    message: "Authentication required",
    code: "auth_required",
  });
}

/**
 * Set up authentication middleware and routes
 * @param app - Express application instance
 */
export function setupAuth(app: Express): void {
  // Session store setup
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "ten-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: 'lax',
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    }),
  };

  // Configure secure cookies in production
  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };
  }

  // Set up session and passport middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email: string, password: string, done) => {
        try {
          console.log(`Attempting login with email: ${email}`);

          // Validate input
          const loginResult = loginSchema.safeParse({ email, password });
          if (!loginResult.success) {
            return done(null, false, { 
              message: loginResult.error.issues.map(i => i.message).join(", ")
            });
          }

          // Check for user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            console.log('No user found with email:', email);
            return done(null, false, { 
              message: "Invalid email or password" 
            });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return done(null, false, { 
              message: "Invalid email or password" 
            });
          }

          console.log('Login successful for user:', email);
          return done(null, user);
        } catch (error) {
          console.error('Login error:', error);
          return done(error instanceof AuthError ? error : new AuthError(
            "Authentication failed",
            "AUTH_FAILED",
            500,
            error
          ));
        }
      }
    )
  );

  // User serialization
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // User deserialization with error handling
  passport.deserializeUser(async (id: number, done) => {
    try {
      if (isNaN(id)) {
        throw new AuthError(
          "Invalid user ID",
          "INVALID_USER_ID",
          400
        );
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        throw new AuthError(
          "User not found",
          "USER_NOT_FOUND",
          404
        );
      }

      done(null, user);
    } catch (error) {
      done(error instanceof AuthError ? error : new AuthError(
        "User deserialization failed",
        "DESERIALIZE_FAILED",
        500,
        error
      ));
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      console.log('Processing registration:', req.body);
      const result = insertUserSchema.safeParse(req.body);

      if (!result.success) {
        console.log('Registration validation failed:', result.error);
        const response: RegistrationResponse = {
          ok: false,
          message: result.error.issues.map((i) => i.message).join(", ")
        };
        return res.status(400).json(response);
      }

      const { username: baseUsername, password, email, firstName } = result.data;

      // Check for existing user with same email
      const [existingUserEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUserEmail) {
        console.log('Email already exists:', email);
        const response: RegistrationResponse = {
          ok: false,
          message: "Email already exists"
        };
        return res.status(400).json(response);
      }

      // Generate unique username from first name
      let finalUsername = baseUsername;
      let counter = 1;
      
      while (true) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, finalUsername))
          .limit(1);

        if (!existingUser) break;
        
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db
        .insert(users)
        .values({
          username: finalUsername,
          password: hashedPassword,
          email,
          firstName,
          role: "user" as const,
          profileCompleted: false
        })
        .returning();

      console.log('User registered successfully:', finalUsername);

      req.login(newUser, (err) => {
        if (err) {
          console.error('Login after registration failed:', err);
          const response: RegistrationResponse = {
            ok: false,
            message: "Registration successful but login failed"
          };
          return res.status(500).json(response);
        }

        const response: RegistrationResponse = {
          ok: true,
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
          }
        };
        return res.json(response);
      });
    } catch (error) {
      console.error('Registration error:', error);
      const response: RegistrationResponse = {
        ok: false,
        message: error instanceof AuthError ? error.message : "Internal server error during registration"
      };
      res.status(error instanceof AuthError ? error.statusCode : 500).json(response);
    }
  });

  // Login endpoint
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    console.log('Processing login:', req.body);

    // Validate login input
    const loginResult = loginSchema.safeParse(req.body);
    if (!loginResult.success) {
      const response: RegistrationResponse = {
        ok: false,
        message: loginResult.error.issues.map(i => i.message).join(", ")
      };
      return res.status(400).json(response);
    }

    passport.authenticate(
      "local",
      (err: unknown, user: Express.User | false, info: { message: string } | undefined) => {
        if (err) {
          console.error('Login authentication error:', err);
          const response: RegistrationResponse = {
            ok: false,
            message: err instanceof AuthError ? err.message : "Internal server error during login"
          };
          return res.status(err instanceof AuthError ? err.statusCode : 500).json(response);
        }

        if (!user) {
          console.log('Login failed:', info?.message);
          const response: RegistrationResponse = {
            ok: false,
            message: info?.message ?? "Login failed"
          };
          return res.status(400).json(response);
        }

        req.logIn(user, (err) => {
          if (err) {
            console.error('Login session error:', err);
            const response: RegistrationResponse = {
              ok: false,
              message: "Login failed due to session error"
            };
            return res.status(500).json(response);
          }

          console.log('Login successful for user:', user.username);
          const response: RegistrationResponse = {
            ok: true,
            message: "Login successful",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
            }
          };
          return res.json(response);
        });
      }
    )(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    const wasAuthenticated = req.isAuthenticated();
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        const response: RegistrationResponse = {
          ok: false,
          message: "Logout failed"
        };
        return res.status(500).json(response);
      }

      console.log('Logout successful, was authenticated:', wasAuthenticated);
      const response: RegistrationResponse = {
        ok: true,
        message: "Logout successful"
      };
      res.json(response);
    });
  });

  // User info endpoint
  app.get("/api/user", requireAuth, (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user;
      const response: RegistrationResponse = {
        ok: true,
        message: "User info retrieved",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
      return res.json(response);
    }

    const response: RegistrationResponse = {
      ok: false,
      message: "Not authenticated"
    };
    res.status(401).json(response);
  });
}
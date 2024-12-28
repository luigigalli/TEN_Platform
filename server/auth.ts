import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq, or } from "drizzle-orm";
import type { Express } from "express";

const scryptAsync = promisify(scrypt);

// Extend Express User interface with our SelectUser type
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "ten-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
      maxAge: 24 * 60 * 60 * 1000
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (identifier, password, done) => {
        try {
          console.log(`Attempting login with identifier: ${identifier}`);

          // Check for both username and email
          const [user] = await db
            .select()
            .from(users)
            .where(or(
              eq(users.username, identifier),
              eq(users.email, identifier)
            ))
            .limit(1);

          if (!user) {
            console.log('No user found with identifier:', identifier);
            return done(null, false, { 
              message: "Invalid username or email" 
            });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            console.log('Password mismatch for user:', identifier);
            return done(null, false, { 
              message: "Incorrect password" 
            });
          }

          console.log('Login successful for user:', identifier);
          return done(null, user);
        } catch (err) {
          console.error('Login error:', err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      console.log('Processing registration:', req.body);
      const result = insertUserSchema.safeParse(req.body);

      if (!result.success) {
        console.log('Registration validation failed:', result.error);
        return res.status(400).json({
          ok: false,
          message: result.error.issues.map((i) => i.message).join(", ")
        });
      }

      const { username, password, email } = result.data;

      // Check for existing user with same username or email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, email)))
        .limit(1);

      if (existingUser) {
        console.log('User already exists:', username);
        return res.status(400).json({
          ok: false,
          message: "Username or email already exists"
        });
      }

      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          role: "user",
        })
        .returning();

      console.log('User registered successfully:', username);

      req.login(newUser, (err) => {
        if (err) {
          console.error('Login after registration failed:', err);
          return res.status(500).json({
            ok: false,
            message: "Registration successful but login failed"
          });
        }

        return res.json({
          ok: true,
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
          }
        });
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        ok: false,
        message: "Internal server error during registration"
      });
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Processing login:', req.body);

    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) {
        console.error('Login authentication error:', err);
        return res.status(500).json({
          ok: false,
          message: "Internal server error during login"
        });
      }

      if (!user) {
        console.log('Login failed:', info?.message);
        return res.status(400).json({
          ok: false,
          message: info?.message ?? "Login failed"
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Login session error:', err);
          return res.status(500).json({
            ok: false,
            message: "Login failed due to session error"
          });
        }

        console.log('Login successful for user:', user.username);
        return res.json({
          ok: true,
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    const wasAuthenticated = req.isAuthenticated();
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          ok: false,
          message: "Logout failed"
        });
      }

      console.log('Logout successful, was authenticated:', wasAuthenticated);
      res.json({
        ok: true,
        message: "Logout successful"
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user;
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });
    }

    res.status(401).json({
      ok: false,
      message: "Not authenticated"
    });
  });
}
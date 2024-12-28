import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema } from "@db/schema";
import { db } from "@db";
import { eq, or } from "drizzle-orm";
import type { Express } from "express";

const scryptAsync = promisify(scrypt);

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
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Authenticated: ${req.isAuthenticated()}`);
    }
    next();
  });

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'identifier',
        passwordField: 'password',
      },
      async (identifier, password, done) => {
        try {
          console.log(`Attempting login with identifier: ${identifier}`);
          // Check for both username and email
          const [user] = await db
            .select()
            .from(users)
            .where(or(eq(users.username, identifier), eq(users.email, identifier)))
            .limit(1);

          if (!user) {
            console.log('No user found with identifier:', identifier);
            return done(null, false, { message: "Invalid username or email" });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            console.log('Password mismatch for user:', identifier);
            return done(null, false, { message: "Incorrect password" });
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

  passport.serializeUser((user: any, done) => {
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

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log('Register request body:', req.body);
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send(
            "Invalid input: " + result.error.issues.map((i) => i.message).join(", ")
          );
      }

      const { username, password, email } = result.data;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, email)))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username or email already exists");
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
          return next(err);
        }
        return res.json({
          ok: true,
          message: "Registration successful",
          user: newUser,
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log('Login request body:', req.body);

    passport.authenticate("local", (err: any, user: Express.User, info: any) => {
      if (err) {
        console.error('Login authentication error:', err);
        return next(err);
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
          return next(err);
        }

        console.log('Login successful for user:', user.username);
        return res.json({
          ok: true,
          message: "Login successful",
          user,
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
      return res.json(req.user);
    }

    res.status(401).send("Not logged in");
  });
}
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Temporarily use memory store while resolving connection issue
  const memoryStore = MemoryStore(session);
  const sessionStore = new memoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });
  
  // PostgreSQL store - will work once connection issue is resolved
  // const pgStore = connectPg(session);
  // const sessionStore = new pgStore({
  //   conString: process.env.DATABASE_URL,
  //   createTableIfMissing: true,
  //   ttl: sessionTtl,
  //   tableName: "sessions",
  // });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const existingUser = await storage.getUserByUsername(claims["sub"]);
  
  if (!existingUser) {
    await storage.createUser({
      username: claims["sub"],
      email: claims["email"] || null,
      firstName: claims["firstName"] || null,
      lastName: claims["lastName"] || null,
      profileImageUrl: claims["profileImageUrl"] || null,
    });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Traditional email/password login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // For admin login, check against known admin credentials
      if (email === 'admin@careercopilot.nl' && password === 'SuperAdmin2025!') {
        const user = await storage.getUserByUsername('dev-user-123');
        if (user) {
          // Create a session for the user
          req.login({ claims: { sub: user.username } }, (err) => {
            if (err) {
              return res.status(500).json({ error: 'Session creation failed' });
            }
            return res.json({ 
              user: user,
              session: { user: user } 
            });
          });
        } else {
          return res.status(401).json({ error: 'User not found' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get("/api/login", (req, res, next) => {
    // In development mode, clear logout flag and redirect to home
    if (process.env.NODE_ENV === 'development') {
      isDevelopmentLoggedOut = false;
      return res.redirect('/');
    }
    
    // In production, use standard OAuth flow
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      // In development mode, set logout flag and redirect
      if (process.env.NODE_ENV === 'development') {
        isDevelopmentLoggedOut = true;
        return res.redirect('/');
      }
      
      // In production, use the standard OpenID Connect logout flow
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

// Simple in-memory development authentication state
let isDevelopmentLoggedOut = false;

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // In development mode, check our simple logout flag
  if (process.env.NODE_ENV === 'development') {
    // If explicitly logged out, return unauthorized
    if (isDevelopmentLoggedOut) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Create mock authenticated user for development
    req.user = {
      claims: {
        sub: 'dev-user-123',
        email: 'admin@careercopilot.demo',
        first_name: 'Demo',
        last_name: 'Administrator'
      }
    };
    req.isAuthenticated = (() => true) as any;
    
    // Ensure the development user exists in storage
    try {
      const existingUser = await storage.getUserByUsername('dev-user-123');
      if (!existingUser) {
        await storage.createUser({
          username: 'dev-user-123',
          email: 'admin@careercopilot.demo',
          firstName: 'Demo',
          lastName: 'Administrator',
          profileImageUrl: null,
        });
      }
    } catch (error) {
      console.log('Development user creation/check failed:', error);
    }
    
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
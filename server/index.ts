import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function createApp() {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Proxy API routes to Vercel functions in development
  if (app.get("env") === "development") {
    // Handle Vercel API functions - proxy to files in api/ directory
    app.use('/api', async (req, res, next) => {
      const apiPath = req.path.slice(1); // remove leading slash
      const functionPath = `./api/${apiPath}.js`;
      
      try {
        const fs = await import('fs');
        if (fs.existsSync(functionPath)) {
          const handler = await import(`../api/${apiPath}.js`);
          return handler.default(req, res);
        }
      } catch (error) {
        console.error(`Error loading API function ${apiPath}:`, error);
      }
      
      // If no API function found, continue to next middleware
      next();
    });
    
    await setupVite(app, server);
  } else {
    // Custom static serving for Vercel serverless
    const path = await import("path");
    const fs = await import("fs");
    
    const distPath = path.resolve(process.cwd(), "dist", "public");
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // fall through to index.html for SPA routing
      app.use("*", (_req, res) => {
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Not found");
        }
      });
    } else {
      console.error("Static files not found at:", distPath);
      serveStatic(app); // fallback to original function
    }
  }

  return { app, server };
}

// Export for Vercel serverless
let appInstance: express.Application | null = null;

export default async function handler(req: Request, res: Response) {
  if (!appInstance) {
    const { app: expressApp } = await createApp();
    appInstance = expressApp;
  }
  return appInstance(req, res);
}

// Start server for local development
if (!process.env.VERCEL) {
  (async () => {
    const { server } = await createApp();
    
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}

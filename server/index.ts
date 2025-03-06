import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Capture response body safely
  const originalResJson = res.json.bind(res);
  res.json = (bodyJson, ...args) => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      logLine += ` :: ${JSON.stringify(bodyJson).slice(0, 200)}...`;
      log(logLine);
    }
    return originalResJson(bodyJson, ...args);
  };

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Setup Vite for Development Mode Only
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Ensure Proper Port and Host Binding
  const port = process.env.PORT || 5000;
  server.listen({ port, host: "localhost" }, () => {
    log(`✅ Server running at http://localhost:${port}`);
  });
})().catch((err) => {
  console.error("🚨 Server startup error:", err);
  process.exit(1);
});

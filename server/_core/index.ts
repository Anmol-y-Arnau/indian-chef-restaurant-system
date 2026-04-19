import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import rateLimit from "express-rate-limit";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerReservationsApi } from "../reservationsApi";

// ─── Rate limiters ────────────────────────────────────────────────────────────

/** Límite general: 300 req/min por IP (protege todas las rutas) */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones, inténtalo de nuevo en un minuto." },
  skip: () => process.env.NODE_ENV === "test",
});

/** Límite estricto para la API pública de reservas: 30 req/min por IP */
const reservationsApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones a la API de reservas." },
  skip: () => process.env.NODE_ENV === "test",
});

/** Límite para tRPC: 200 req/min por IP */
const trpcLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones, inténtalo de nuevo en un minuto." },
  skip: () => process.env.NODE_ENV === "test",
});

// ─── Port helpers ─────────────────────────────────────────────────────────────

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ─── Server bootstrap ─────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust the first proxy hop (Manus reverse proxy / load balancer)
  // Required for express-rate-limit to read the real client IP from X-Forwarded-For
  app.set("trust proxy", 1);

  // Apply general rate limit to all routes
  app.use(generalLimiter);

  // Configure body parser with size limit (50 MB for file uploads)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Public REST API for reservations — stricter rate limit
  app.use("/api/reservations", reservationsApiLimiter);
  registerReservationsApi(app);

  // tRPC API — dedicated rate limit
  app.use(
    "/api/trpc",
    trpcLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

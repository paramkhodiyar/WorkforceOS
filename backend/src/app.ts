import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { config } from "./config/env";
import { requestLogger } from "./middleware/requestLogger.middleware";
import { notFound } from "./middleware/notFound.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { csrfProtection } from "./middleware/csrf.middleware";
import routes from "./routes";

const app = express();

app.disable("x-powered-by");
app.use(cookieParser());
app.use(csrfProtection);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:4000", "http://localhost:4001", "https:"],
        objectSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    frameguard: { action: 'deny' },
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true);
      // Wildcard mode – allow everything (dev convenience)
      if (config.CORS_ORIGINS.includes("*")) return callback(null, true);
      // Strict allow-list check
      if (config.CORS_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-workforceos-bridge'],
    exposedHeaders: ['x-csrf-token'],
  })
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;

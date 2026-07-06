import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { config } from "./config/env";
import { requestLogger } from "./middleware/requestLogger.middleware";
import { notFound } from "./middleware/notFound.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import routes from "./routes";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
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
    allowedHeaders: ['Content-Type', 'Authorization'],
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

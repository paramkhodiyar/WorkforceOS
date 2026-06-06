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

app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGINS
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

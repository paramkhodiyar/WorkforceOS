import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/errors.util";

export function validate(schema: ZodSchema, target: "body" | "query" | "params" = "body") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = target === "query" ? req.query : target === "params" ? req.params : req.body;
      const parsed = await schema.safeParseAsync(data);
      if (!parsed.success) {
        const details = parsed.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message
        }));
        throw AppError.unprocessable("Validation failed", details);
      }
      if (target === "query") {
        req.query = parsed.data;
      } else if (target === "params") {
        req.params = parsed.data;
      } else {
        req.body = parsed.data;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

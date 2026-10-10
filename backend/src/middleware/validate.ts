/**
 * Request Validation Middleware
 *
 * Generic Zod validation middleware that validates body, query, and params.
 * Returns structured validation errors in the standardized format.
 *
 * @example
 *   router.post("/students", validate({ body: createStudentSchema }), handler)
 *   router.get("/search", validate({ query: searchSchema }), handler)
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/response";

export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        // Treat missing/undefined body as {} so optional-only schemas
        // (e.g. cookie based auth refresh) do not hard fail
        req.body = schemas.body.parse(req.body ?? {});
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query) as any;
        // Express 5: req.query is a getter-only property. Merge instead of reassigning.
        try {
          Object.assign(req.query, parsedQuery);
        } catch {
          (req as any).validatedQuery = parsedQuery;
        }
      }
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params) as any;
        try {
          Object.assign(req.params, parsedParams);
        } catch {
          (req as any).validatedParams = parsedParams;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        sendError(
          res,
          422,
          "VALIDATION_ERROR",
          "Please check your input and try again.",
          fieldErrors,
          req.requestId
        );
        return;
      }
      next(error);
    }
  };
}

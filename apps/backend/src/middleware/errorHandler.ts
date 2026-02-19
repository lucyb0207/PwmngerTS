import { Request, Response, NextFunction } from "express";
import { BaseError } from "@pwmnger/errors";
import logger from "../utils/logger";

export const errorHandler = (
  err: Error | BaseError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof BaseError) {
    logger.error({
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      stack: err.stack,
      path: req.path,
    });
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // Unexpected errors
  logger.error({
    message: "Unexpected Error",
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  });
};

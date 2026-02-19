export class BaseError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class VaultError extends BaseError {
  constructor(message: string, statusCode: number = 400, code: string = "VAULT_ERROR") {
    super(message, statusCode, code);
  }
}

export class AuthError extends BaseError {
  constructor(message: string, statusCode: number = 401, code: string = "AUTH_ERROR") {
    super(message, statusCode, code);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, statusCode: number = 422, code: string = "VALIDATION_ERROR") {
    super(message, statusCode, code);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, code: string = "CONFLICT") {
    super(message, 409, code);
  }
}

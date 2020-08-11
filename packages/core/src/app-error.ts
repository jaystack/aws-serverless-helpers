export class AppError extends Error {
  readonly code: ErrorCodes | string;
  readonly originalError?: Error;

  constructor(code?: string | ErrorCodes, originalError?: Error);
  constructor(code?: string | ErrorCodes, message?: string, originalError?: Error);

  constructor(code: string | ErrorCodes = ErrorCodes.UNKNOWN, message?: string | Error, originalError?: Error) {
    super();

    if (message instanceof Error) {
      originalError = message;
      message = originalError.message;
    }

    this.name = this.constructor.name;
    this.message = message ?? originalError?.message ?? code;
    this.code = code;
    this.originalError = originalError;

    if (originalError) {
      this.stack = originalError.stack;
    } else {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export const isAppError = (error: any): error is AppError => error instanceof AppError;

export enum ErrorCodes {
  UNKNOWN = "Error:Unknown",
  CONFIGURATION = "Error:Configuration",

  UNAUTHORIZED = "Error:Auth:Unauthorized",
  INSUFFICIENT_PRIVILEGES = "Error:Auth:InsufficientPrivileges",

  VALIDATION = "Error:Validation",

  RESOURCE_NOT_FOUND = "Error:Resource:NotFound",

  DB_UNKNOWN = "Error:Db:Unknown",
  DB_CONNECTION = "Error:Db:Connection",
  DB_CONSTRAINT = "Error:Db:Constraint",
}

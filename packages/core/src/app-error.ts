export class AppError extends Error {
  readonly code: ErrorCodes | string = ErrorCodes.UNKNOWN;
  readonly payload?: any;

  constructor(code: string = ErrorCodes.UNKNOWN, message: string = code, payload?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.payload = payload;
  }
}

export enum ErrorCodes {
  UNKNOWN = "Error:Unknown",
  CONFIGURATION = "Error:Configuration",

  UNAUTHORIZED = "Error:Auth:Unauthorized",
  INSUFFICIENT_PRIVILEGES = "Error:Auth:InsufficientPrivileges",

  VALIDATION = "Error:Validation",

  RESOURCE_NOT_FOUND = "Error:Resource:NotFound",
}

import {
  BaseError,
  DatabaseError,
  ValidationError,
  ConnectionError,
  // ValidationErrorItem,
  // TimeoutError,
  // UniqueConstraintError,
  // ExclusionConstraintError,
  // ForeignKeyConstraintError,
  // ConnectionRefusedError,
  // AccessDeniedError,
  // HostNotFoundError,
  // HostNotReachableError,
  // InvalidConnectionError,
  // ConnectionTimedOutError,
  // EmptyResultError
} from "sequelize";
import { ErrorCodes, AppError } from "@jaystack/sls-core";

export const isSequelizeError = (error) => error instanceof BaseError;
export const isSequelizeDatabaseError = (error) => error instanceof DatabaseError;
export const isSequelizeConnectionError = (error) => error instanceof ConnectionError;
export const isSequelizeValidationError = (error) => error instanceof ValidationError;

export const isSequelizeUniqueConstraintError = (error) =>
  /UniqueConstraintError$/.test(error.name);

const sequelizeErrorMap = {
  /**
   * Thrown when a database query times out because of a deadlock
   */
  TimeoutError: ErrorCodes.DB_UNKNOWN,
  /**
   * Thrown when a unique constraint is violated in the database
   */
  UniqueConstraintError: ErrorCodes.DB_CONSTRAINT,
  /**
   * Thrown when an exclusion constraint is violated in the database
   */
  ExclusionConstraintError: ErrorCodes.DB_CONSTRAINT,
  /**
   * Thrown when a foreign key constraint is violated in the database
   */
  ForeignKeyConstraintError: ErrorCodes.DB_CONSTRAINT,
  /**
   * Thrown when a connection to a database is refused
   */
  ConnectionRefusedError: ErrorCodes.DB_CONNECTION,
  /**
   * Thrown when a connection to a database is refused due to insufficient privileges
   */
  AccessDeniedError: ErrorCodes.CONFIGURATION,
  /**
   * Thrown when a connection to a database has a hostname that was not found
   */
  HostNotFoundError: ErrorCodes.DB_CONNECTION,
  /**
   * Thrown when a connection to a database has a hostname that was not reachable
   */
  HostNotReachableError: ErrorCodes.CONFIGURATION,
  /**
   * Thrown when a connection to a database has invalid values for any of the connection parameters
   */
  InvalidConnectionError: ErrorCodes.DB_CONNECTION,
  /**
   * Thrown when a connection to a database times out
   */
  ConnectionTimedOutError: ErrorCodes.DB_CONNECTION,
  /**
   * Thrown when a record was not found, Usually used with rejectOnEmpty mode (see message for details)
   */
  EmptyResultError: ErrorCodes.DB_UNKNOWN,
};

/**
 * Map known Sequelize error to AppError, or return it
 * @param sequelizeError
 */
export function mapSequelizeError(sequelizeError: Error): Error | AppError {
  if (!isSequelizeError(sequelizeError)) return sequelizeError;

  if (isSequelizeValidationError(sequelizeError)) {
    /**
     * Validation Error. Thrown when the sequelize validation has failed. The error contains an `errors`
     * property, which is an array with 1 or more ValidationErrorItems, one for each validation that failed.
     */
    return new AppError(ErrorCodes.DB_CONSTRAINT, sequelizeError);
  }

  const code =
    sequelizeErrorMap[sequelizeError.name] ??
    sequelizeErrorMap[sequelizeError.name.replace(/^Sequelize/, "")];

  return code ? new AppError(code, sequelizeError) : sequelizeError;
}

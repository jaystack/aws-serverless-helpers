import Debug from "debug";
import { DecoratorMiddleware } from "./lambda-middleware";
import { AppError, ErrorCodes, isAppError, printAppError } from "./app-error";
import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "./api-gateway-responses";

export interface WithParsedBodyOpts {
  shouldThrowIfInvalid?: boolean;
  shouldThrowIfFalsy?: boolean;
}
export const withParsedBody = ({
  shouldThrowIfInvalid = true,
  shouldThrowIfFalsy = true,
}: WithParsedBodyOpts = {}): DecoratorMiddleware => {
  const debug = Debug("withParsedBody");
  return (lambda) => async (event, context, dependencies, callback) => {
    if (!event.body) {
      debug("Missing body!");
      if (shouldThrowIfFalsy) throw new AppError(ErrorCodes.VALIDATION, "missing JSON body");
      return lambda(event, context, dependencies, callback);
    }
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch {
      debug("Could not parse body!");
      if (shouldThrowIfInvalid) throw new AppError(ErrorCodes.VALIDATION, "invalid JSON body");
    }
    return lambda(event, context, { ...dependencies, parsedBody }, callback);
  };
};

export type WithOkResponseOptions = {
  cors?: boolean;
  headers?: { [k: string]: string };
  wrapResult?: boolean;
};
export const withOkResponse = ({
  cors,
  headers,
  wrapResult = true,
}: WithOkResponseOptions = {}): DecoratorMiddleware => {
  // const debug = Debug("withOkResponse");
  return (lambda) => async (event, context, deps, callback) => {
    const result = await lambda(event, context, deps, callback);
    const body = wrapResult ? { ok: true, result } : result;
    return ok({ body, cors, headers });
  };
};

export type WithAppErrorResponseOptions = {
  cors?: boolean;
  headers?: { [k: string]: string };
  printError?: boolean;
};
export const withAppErrorResponse = ({
  cors,
  headers,
  printError = true,
}: WithAppErrorResponseOptions = {}): DecoratorMiddleware => {
  const debug = Debug("withAppErrorResponse");
  return (lambda) => async (event, context, deps, callback) => {
    try {
      const result = await lambda(event, context, deps, callback);
      return result;
    } catch (error) {
      debug("Caught error: %s", error.name);
      const appError = isAppError(error) ? error : new AppError(ErrorCodes.UNKNOWN, error);
      if (printError) {
        printAppError(appError);
      }
      const response = getHttpResponseForAppError(appError, { cors, headers });
      debug("Mapped response: %d %j", response.statusCode, response.body);
      return response;
    }
  };
};
const AppErrorHttpResponseMap: Partial<Record<ErrorCodes, any>> = {
  "Error:Auth:Unauthorized": unauthorized,
  "Error:Auth:InsufficientPrivileges": forbidden,
  "Error:Db:Constraint": badRequest,
  "Error:Validation": badRequest,
  "Error:Resource:NotFound": notFound,
};

function getHttpResponseForAppError(error: AppError, params) {
  const nonDefaultResponse = AppErrorHttpResponseMap[error.code];
  if (nonDefaultResponse) {
    return nonDefaultResponse({ message: error.message, ...params });
  }
  return internalServerError(params);
}

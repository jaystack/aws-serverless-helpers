import { DecoratorMiddleware } from "./lambda-middleware";
import { AppError, ErrorCodes, isAppError } from "./app-error";
import {
  badRequest,
  forbidden,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "./api-gateway-responses";

export const withParsedBody = (): DecoratorMiddleware => (lambda) => async (
  event,
  context,
  dependencies,
  callback
) => {
  if (!event || typeof event.body !== "string") {
    throw new AppError(ErrorCodes.VALIDATION, "missing JSON body");
  }
  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch {
    throw new AppError(ErrorCodes.VALIDATION, "invalid JSON body");
  }
  return lambda(event, context, { ...dependencies, parsedBody }, callback);
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
}: WithOkResponseOptions = {}): DecoratorMiddleware => (lambda) => async (
  event,
  context,
  deps,
  callback
) => {
  const result = await lambda(event, context, deps, callback);
  const body = wrapResult ? { ok: true, result } : result;
  return ok({ body, cors, headers });
};

export type WithAppErrorResponseOptions = {
  cors?: boolean;
  headers?: { [k: string]: string };
};

export const withAppErrorResponse = ({
  cors,
  headers,
}: WithAppErrorResponseOptions = {}): DecoratorMiddleware => (lambda) => async (
  event,
  context,
  deps,
  callback
) => {
  try {
    const result = await lambda(event, context, deps, callback);
    return result;
  } catch (error) {
    return getHttpResponseForAppError(error, { cors, headers });
  }
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

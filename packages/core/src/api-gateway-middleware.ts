import { DecoratorMiddleware } from "./lambda-middleware";
import { AppError, ErrorCodes } from "./app-error";
import { ok } from "./api-gateway-responses";

export const withParsedBody = (): DecoratorMiddleware => (lambda) => async (event, context, dependencies, callback) => {
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

export type WithOkResponseOptions = { cors?: boolean; headers?: { [k: string]: string }; wrapResult?: boolean };
export const withOkResponse = ({
  cors,
  headers,
  wrapResult = true,
}: WithOkResponseOptions = {}): DecoratorMiddleware => (lambda) => async (event, context, deps, callback) => {
  const result = await lambda(event, context, deps, callback);
  const body = wrapResult ? { ok: true, result } : result;
  return ok({ body, cors, headers });
};

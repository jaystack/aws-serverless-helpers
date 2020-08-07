import { Context, Callback, Handler } from "aws-lambda";

export type DecoratedHandler<Event = any, Result = any> = (
  event: Event,
  context: Context,
  dependencies?: any,
  callback?: Callback<Result>
) => Promise<Result> | void;

export type DecoratorMiddleware = (handler: DecoratedHandler) => DecoratedHandler;

export const composeDecoratorMiddlewares = (...middlewares: DecoratorMiddleware[]): DecoratorMiddleware => (
  decoratedHandler: DecoratedHandler
) => {
  const decoratorChain = middlewares.reduceRight((current, next) => next(current), decoratedHandler);

  return async (event, context, dependencies, callback) => {
    return decoratorChain(event, context, dependencies, callback);
  };
};

export const composeDecoratedHandler = (handler: DecoratedHandler, ...middlewares: DecoratorMiddleware[]): Handler =>
  composeDecoratorMiddlewares(...middlewares)(handler);

export const noopMiddleware: DecoratorMiddleware = (lambda) => async (...args) => lambda(...args);

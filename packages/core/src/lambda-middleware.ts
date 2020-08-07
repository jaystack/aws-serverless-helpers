import { Context, Callback, Handler } from "aws-lambda";

export type DecoratedHandler<Event = any, Result = any> = (
  event: Event,
  context: Context,
  dependencies: any,
  callback: Callback<Result>
) => Promise<any>;

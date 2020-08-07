import { Context } from "aws-lambda";
import { composeDecoratorMiddlewares, noopMiddleware } from "./lambda-middleware";

describe("composeDecoratorMiddlewares", () => {
  test.each([[1], [2], [3], [6], [13], [42], [420], [1337]])("works with %d middleware(s)", async (length) => {
    const middlewareMocks = Array.from({ length }).map(() => jest.fn(noopMiddleware));

    const composedMiddlewares = composeDecoratorMiddlewares(...middlewareMocks);

    // no side effects during composition
    for (const middleware of middlewareMocks) {
      expect(middleware.mock.calls).toHaveLength(0);
    }

    const decoratedLambdaMock = jest.fn(async (t) => t);
    const lambda = composedMiddlewares(decoratedLambdaMock);

    // middlewares are called exactly once when fed a lambda
    for (const middleware of middlewareMocks) {
      expect(middleware.mock.calls).toHaveLength(1);
      expect(middleware.mock.calls[0]).toHaveLength(1);
      expect(typeof middleware.mock.calls[0][0]).toBe("function");
    }
    // the lambda itself shouldn't be called
    expect(decoratedLambdaMock.mock.calls).toHaveLength(0);

    const testPayload = { test: 1, very: "much" };

    await expect(lambda(testPayload, {} as Context)).resolves.toEqual(testPayload);

    expect(decoratedLambdaMock.mock.calls).toHaveLength(1);
    // decorated lambda gets called with correct number of arguments
    expect(decoratedLambdaMock.mock.calls[0]).toHaveLength(4);
    expect(decoratedLambdaMock.mock.calls[0][0]).toEqual(testPayload);
  });

  //TODO test composition order
});

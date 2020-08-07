import { APIGatewayProxyResult } from "aws-lambda";

const defaultFormatter = (b) => b;
const objectFormatter = (b) => JSON.stringify(b);

const formatterByType = {
  "[object Object]": objectFormatter,
  "[object Array]": objectFormatter,
};

export function getFormattedBody(body: any): string {
  const formatter = formatterByType[Object.prototype.toString.call(body)] ?? defaultFormatter;
  return formatter(body);
}

const wildcardCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

export const apiGatewayResultFactory = (
  statusCode: number,
  body: any,
  headers: any,
  cors?: boolean
): APIGatewayProxyResult => {
  return {
    statusCode,
    body: getFormattedBody(body),
    headers: { ...headers, ...(cors ? wildcardCorsHeaders : {}) },
  };
};

export interface ApiGwResponseFactoryOptions {
  headers?: { [k: string]: string };
  cors?: boolean;
}

export interface ApiGwErrorResponseFactoryOptions extends ApiGwResponseFactoryOptions {
  message?: string;
}

export function ok({
  body,
  headers = {},
  cors,
}: ApiGwErrorResponseFactoryOptions & { body?: any } = {}): APIGatewayProxyResult {
  return apiGatewayResultFactory(200, body, headers, cors);
}

export function badRequest({
  message = "⚠",
  headers = {},
  cors,
}: ApiGwErrorResponseFactoryOptions = {}): APIGatewayProxyResult {
  return apiGatewayResultFactory(400, { message: `Invalid request: ${message}` }, headers, cors);
}

export function internalServerError({
  message = "🔥",
  headers = {},
  cors,
}: ApiGwErrorResponseFactoryOptions = {}): APIGatewayProxyResult {
  return apiGatewayResultFactory(500, { message: `Internal server error: ${message}` }, headers, cors);
}

export function unauthorized({ headers = {}, cors }: ApiGwErrorResponseFactoryOptions = {}): APIGatewayProxyResult {
  return apiGatewayResultFactory(401, { message: "Unauthorized" }, headers, cors);
}

export function notFound({ headers = {}, cors }: ApiGwErrorResponseFactoryOptions = {}): APIGatewayProxyResult {
  return apiGatewayResultFactory(404, { message: "Not Found" }, headers, cors);
}

export function forbidden({ headers = {}, cors }: ApiGwErrorResponseFactoryOptions = {}): APIGatewayProxyResult {
  return apiGatewayResultFactory(403, { message: "Forbidden" }, headers, cors);
}

export function customError({
  body,
  headers = {},
  cors,
  statusCode = 400,
}: ApiGwErrorResponseFactoryOptions & { body?: any; statusCode?: number } = {}): APIGatewayProxyResult {
  return apiGatewayResultFactory(statusCode, body, headers, cors);
}

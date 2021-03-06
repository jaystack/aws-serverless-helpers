import Debug from "debug";
import { DecoratorMiddleware, AppError, ErrorCodes, isAppError } from "@jaystack/sls-core";
import { Options, Sequelize } from "sequelize";
import { mapSequelizeError } from "./sequelize-errors";

export interface WithSequelizeOptions extends Omit<Options, "port"> {
  shouldAuthenticate?: boolean;
  shouldSync?: boolean;
  shouldCloseConnection?: boolean;
  initModelsCallback?(sequelize: Sequelize): void | Promise<void>;
  port?: string | number;
}

const defaultConfig: WithSequelizeOptions = {
  shouldAuthenticate: false,
  shouldCloseConnection: false,
  shouldSync: false,
  dialect: "postgres",
  port: 5432,
  pool: {
    // Maximum number of connection in pool
    max: 2,
    // Minimum number of connection in pool
    min: 0,
    // The maximum time, in milliseconds, that a connection can be idle before being released.
    // default: 10000
    idle: 5555,
    // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    // default: 60000
    acquire: 3000,
    // The time interval, in milliseconds, after which sequelize-pool will remove idle connections.
    // default: 1000
    evict: 1040,
  },
};

const requiredParams = ["host", "port", "username", "password", "database", "dialect"];
function validateSequelizeOptions(
  userConfig?: WithSequelizeOptions,
  base: WithSequelizeOptions = defaultConfig
): WithSequelizeOptions {
  const options = { ...base, ...userConfig };

  for (const param of requiredParams) {
    if (typeof options[param] === "undefined") {
      throw new AppError(ErrorCodes.CONFIGURATION, `Missing required sequelize param: ${param}`);
    }
  }

  return { ...options, port: Number(options.port) };
}

let sequelize: Sequelize;
const invocationCount = 0;
export const withSequelize = (
  userOptions: WithSequelizeOptions,
  SeqCtr = Sequelize
): DecoratorMiddleware => {
  const options = validateSequelizeOptions(userOptions);

  return (handler) => {
    const debug = Debug(`withSequelize:${handler.name ?? "anon"}`);

    return async (event, context, dependencies, callback) => {
      try {
        if (!sequelize) {
          debug(`'${options.database}' db on host: '${options.host}'`);
          sequelize = new SeqCtr(options as Options);

          if (options.initModelsCallback) {
            debug("Initializing models");
            await options.initModelsCallback(sequelize);
          }

          if (options.shouldSync) {
            debug("synchronizing tables");
            await sequelize.sync();
          }
        } else {
          debug(`reusing Sequelize global instance for the ${invocationCount}th time`);
        }

        if (options.shouldAuthenticate) {
          debug("authenticating");
          await sequelize.authenticate();
        }

        const result = await handler(event, context, { ...dependencies, sequelize }, callback);
        debug("got handler result");

        return result;
      } catch (error) {
        // wrap sequelize error
        throw isAppError(error) ? error : mapSequelizeError(error);
      } finally {
        if (sequelize && options.shouldCloseConnection) {
          debug("closing connection");
          try {
            await sequelize.close();
            debug("Cleaned up DB!");
          } catch (error) {
            console.error("error while cleaning up sequelize", error);
          }
        }
      }
    };
  };
};

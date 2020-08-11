import Debug from "debug";
import { DecoratorMiddleware, AppError, ErrorCodes } from "@jaystack/sls-core";
import { Options, Sequelize } from "sequelize";

export interface WithSequelizeOptions extends Options {
  shouldAuthenticate?: boolean;
  shouldCloseConnection?: boolean;
}

const defaultConfig: WithSequelizeOptions = {
  shouldAuthenticate: false,
  shouldCloseConnection: false,
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

function validateSequelizeOptions(
  userConfig?: WithSequelizeOptions,
  base: WithSequelizeOptions = defaultConfig
): WithSequelizeOptions {
  const options = { ...base, ...userConfig };
  const { host, port, username, password, database, dialect = "postgres" } = options;

  if (!host || !port || !username || !password || !dialect || !database) {
    throw new AppError(ErrorCodes.CONFIGURATION, "Missing sequelize helper parameter(s)!");
  }

  return options;
}

let sequelize: Sequelize;
const invocationCount = 0;
export const withSequelize = (userOptions: WithSequelizeOptions, SeqCtr = Sequelize): DecoratorMiddleware => {
  const options = validateSequelizeOptions(userOptions);

  return (handler) => {
    const debug = Debug(`withSequelize:${handler.name ?? "anon"}`);

    return async (event, context, dependencies, callback) => {
      try {
        if (!sequelize) {
          debug(`'${options.database}' db on host: '${options.host}'`);
          sequelize = new SeqCtr(options);
        } else {
          debug(`reusing Sequelize global instance for the ${invocationCount} time`);
        }

        if (options.doAuthenticate) {
          debug("authenticate");
          await sequelize.authenticate();
        }

        const result = await λ(event, context, { ...deps, sequelize }, callback);
        debug("result");

        return result;
      } catch (error) {
        if (isAppException(error)) {
          throw error;
        }
        console.error(error);
        const knownErrorCode = getSequelizeErrorCode(error);

        throw knownErrorCode ? new AppException(knownErrorCode) : error;
      } finally {
        if (sequelize && options.doCloseAfter) {
          debug("Closing DB");
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

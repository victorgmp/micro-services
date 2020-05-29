import * as _ from 'lodash';
import mongoose, { ConnectionOptions } from 'mongoose';
import { ServiceResources } from 'polymetis-node';

export interface MongoConfiguration {
  auth?: {
    user?: string;
    password?: string;
  };
  host?: string;
  port?: number;
  dbName?: string;
}
export const mongoConf: MongoConfiguration = {
  auth: {
    user: _.get(process.env, 'MONGO_USERNAME'),
    password: _.get(process.env, 'MONGO_PASSWORD'),
  },
  host: _.get(process.env, 'MONGO_HOST'),
  port: _.toNumber(_.get(process.env, 'MONGO_PORT')),
  dbName: _.get(process.env, 'MONGO_DATABASE'),
};

const dbOptions: ConnectionOptions = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

export default class MongoDBConnection {
  constructor(protected resources: ServiceResources) {}

  async connect() {
    try {
      const url = `mongodb://${mongoConf.auth.user}:${mongoConf.auth.password}@${mongoConf.host}:${mongoConf.port}/${mongoConf.dbName}`;

      await mongoose.connect(url, dbOptions);

      const connection = mongoose.connection;

      connection.once('open', () => {
        this.resources.logger.info(`Connected to database ${this.resources.configuration.service.service} service`);
      });

    } catch (error) {
      this.resources.logger.error(`connection to database ${this.resources.configuration.service.service} service fail`);
      throw error;
    }
  }
}

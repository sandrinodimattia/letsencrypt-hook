import EventEmitter from 'events';

import { getAccount } from './account';
import { getCertificate } from './certificate';

export default class LetsEncryptHook extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.logger = this.createLogger(options.logger);

    // Attach the storage provider.
    if (this.options.storageProvider) {
      this.options.storageProvider(this.on.bind(this), this.logger);
    }
  }

  createLogger(logger) {
    logger = logger || { };
    if (!logger.debug) logger.debug = this.logger.verbose;
    if (!logger.info) logger.info = this.logger.log;
    if (!logger.debug) logger.debug = () => { };
    if (!logger.info) logger.info = () => { };
    if (!logger.error) logger.error = () => { };
    return logger;
  }

  ensureEmit(event, context, callback) {
    this.logger.debug(`Raising event '${event}'`);

    if (!EventEmitter.listenerCount(this, event)) {
      return callback(new Error(`No handler has been defined for the '${event}' event.`));
    }

    this.emit(event, context, callback);
  }

  register(email, domains, callback) {
    getAccount(this.ensureEmit.bind(this), this.options, email, (err, registration) => {
      if (err) {
        return callback(err);
      }

      getCertificate(this.ensureEmit.bind(this), this.options, registration, domains, callback);
    });
  }
}

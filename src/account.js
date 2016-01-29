import async from 'async';
import LeCore from 'letiny-core';

export function getAccount(emit, options, email, callback) {
  loadRegistration(emit, { email, options }, (err, registration) => {
    if (err) {
      return callback(err);
    }

    if (registration) {
      return callback(null, registration);
    }

    createRegistration(emit, { email, options }, (err, privateKey, registration) => {
      if (err) {
        return callback(err);
      }

      saveRegistration(emit, { email, options, privateKey, registration }, (err) => {
        if (err) {
          return callback(err);
        }

        return callback(null, { privateKey, ...registration });
      });
    });
  });
};

function loadRegistration(emit, context, callback) {
  emit('registration:load', context, callback);
}

function createRegistration(emit, context, callback) {
  async.waterfall([
    (cb) => {
      LeCore.getAcmeUrls(context.options.discoveryUrl, (err, urls) => {
        if (err) {
          return cb(err);
        }

        cb(null, urls);
      });
    },
    (urls, cb) => {
      LeCore.leCrypto.generateRsaKeypair(context.options.keys.account.modulusBits, context.options.keys.account.exponent, (err, pem) => {
        if (err) {
          return cb(err);
        }

        cb(null, urls, pem.privateKeyPem);
      });
    },
    (urls, privateKey, cb) => {
      const newAccountRequest = {
        newRegUrl: urls.newReg,
        email: context.email,
        accountPrivateKeyPem: privateKey,
        agreeToTerms: (tosUrl, done) => {
          if (context.options.agreeToTerms) {
            return done(null, tosUrl);
          }

          done(null);
        }
      };

      LeCore.registerNewAccount(newAccountRequest, (err, registration) => {
        if (err) {
          return cb(err);
        }

        return cb(null, privateKey, registration);
      });
    }
  ],
  (err, privateKey, registration) => {
    if (err) {
      return callback(err);
    }

    return callback(null, privateKey, registration);
  });
}

function saveRegistration(emit, context, callback) {
  emit('registration:save', context, callback);
}

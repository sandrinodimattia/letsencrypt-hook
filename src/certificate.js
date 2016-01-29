import async from 'async';
import LeCore from 'letiny-core';

export function getCertificate(emit, options, account, domains, callback) {
  createCertificate(emit, { options, account, domains }, (err, privateKey, certificate) => {
    if (err) {
      return callback(err);
    }

    return callback(null, { privateKey, certificate });
  });
};

function saveChallenge(emit, context, callback) {
  emit('challenge:save', context, callback);
}

function removeChallenge(emit, context, callback) {
  emit('challenge:remove', context, callback);
}

function createCertificate(emit, context, callback) {
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
      LeCore.leCrypto.generateRsaKeypair(context.options.keys.domain.modulusBits, context.options.keys.domain.exponent, (err, pem) => {
        if (err) {
          return cb(err);
        }

        cb(null, urls, pem.privateKeyPem);
      });
    },
    (urls, privateKey, cb) => {
      const getCertificateRequest = {
        newAuthzUrl: urls.newAuthz,
        newCertUrl: urls.newCert,
        domainPrivateKeyPem: privateKey,
        accountPrivateKeyPem: context.account.privateKey,
        domains: context.domains,
        setChallenge: (hostname, key, value, done) => {
          saveChallenge(emit, { hostname, key, value }, (err) => {
            if (err) {
              return cb(err);
            }

            done();
          });
        },
        removeChallenge: (hostname, key, done) => {
          removeChallenge(emit, { hostname, key }, (err) => {
            if (err) {
              return cb(err);
            }

            done();
          });
        }
      };

      LeCore.getCertificate(getCertificateRequest, (err, cert) => {
        if (err) {
          return cb(err);
        }

        return cb(null, privateKey, cert);
      });
    }
  ],
  (err, privateKey, certificate) => {
    if (err) {
      return callback(err);
    }

    return callback(null, privateKey, certificate);
  });
}

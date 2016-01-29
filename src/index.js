import LeCore from 'letiny-core';
import LetsEncryptHook from './hook';

module.exports = function(options) {
  options = options || { };
  options.agreeToTerms = options.agreeToTerms || false;
  options.discoveryUrl = options.discoveryUrl || LeCore.productionServerUrl;
  options.keys = options.keys || { };
  options.keys.domain = options.keys.domain || { };
  options.keys.domain = { modulusBits: 2048, exponent: 65537, ...options.keys.domain };
  options.keys.account = options.keys.account || { };
  options.keys.account = { modulusBits: 2048, exponent: 65537, ...options.keys.account };

  return new LetsEncryptHook(options);
};

/*
 * Emulate 'eth_accounts' / 'eth_sendTransaction' using 'eth_sendRawTransaction'
 *
 * The two callbacks a user needs to implement are:
 * - getAccounts() -- array of addresses supported
 * - signTransaction(tx) -- sign a raw transaction object
 */

const xhr = process.browser ? require('xhr') : require('request')
const async = require('async')
const inherits = require('util').inherits
const extend = require('xtend')
const Subprovider = require('web3-provider-engine/subproviders/subprovider.js')
const estimateGas = require('web3-provider-engine/util/estimate-gas.js')

module.exports = UportSubprovider

// handles the following RPC methods:
//   eth_coinbase
//   eth_accounts
//   eth_sendTransaction


inherits(UportSubprovider, Subprovider)

function UportSubprovider(opts){
  const self = this

  // Chasqui URL (default to standard)
  self.chasquiUrl = opts.chasquiUrl;

  // Function to get the sessionId if stored
  self.getSessionId = opts.getSessionId;

  // uportConnectHandler deals with displaying the
  // uport connect data as QR code or clickable link

  self.uportConnectHandler = opts.uportConnectHandler;

  // ethUriHandler deals with displaying the
  // ethereum URI either as a QR code or
  // clickable link for mobile
  self.ethUriHandler = opts.ethUriHandler;

  self.closeQR = opts.closeQR;

}

UportSubprovider.prototype.handleRequest = function(payload, next, end){
  const self = this

  switch(payload.method) {

    case 'eth_coinbase':
      self.getAddress(function(err, address) {
        end(err, address);
      });
      return

    case 'eth_accounts':
      self.getAddress(function(err, address) {
      // the result should be a list of addresses
        end(err, [address]);
      });
      return

    case 'eth_sendTransaction':
      var txParams = payload.params[0]
      async.waterfall([
        self.validateTransaction.bind(self, txParams),
        self.txParamsToUri.bind(self, txParams),
        self.signAndReturnTxHash.bind(self)
      ], end)
      return

    case 'eth_sign':
      var address = payload.params[0]
      var message = payload.params[1]
      // non-standard "extraParams" to be appended to our "msgParams" obj
      // good place for metadata
      var extraParams = payload.params[2] || {}
      var msgParams = extend(extraParams, {
        from: address,
        data: message,
      })
      async.waterfall([
        self.validateMessage.bind(self, msgParams),
        self.approveMessage.bind(self, msgParams),
        function checkApproval(didApprove, cb){
          cb( didApprove ? null : new Error('User denied message signature.') )
        },
        self.signMessage.bind(self, msgParams),
      ], end)
      return

    default:
      next();
    return

  }
}

UportSubprovider.prototype.txParamsToUri = function(txParams, cb) {
  var uri = "ethereum:" + txParams.to;
  if (txParams.value) {
    uri += "?value=" + txParams.value;
  }
  if (txParams.data) {
    var symbol = txParams.value ? "&" : "?";
    uri += symbol + "bytecode=" + txParams.data;
  }
  cb(null, uri);
}

UportSubprovider.prototype.signAndReturnTxHash = function(ethUri, cb) {
  const self = this

  var randomStr = self.getSessionId();
  var apiPath = "tx/" + randomStr;
  ethUri += "&callback_url=" + self.chasquiUrl + apiPath
  self.ethUriHandler(ethUri);
  self.pollForResult(apiPath, 'tx', function(err, txHash) {
    self.closeQR();
    cb(err, txHash);
  });
}

UportSubprovider.prototype.getAddress = function(cb) {
  const self = this

  if (self.address) {
    cb(null, self.address);
  } else {
    var randomStr = self.getSessionId();
    var apiPath = "addr/" + randomStr;
    var ethUri = "ethereum:me?callback_url=" + self.chasquiUrl + apiPath;
    self.uportConnectHandler(ethUri);
    self.pollForResult(apiPath, 'address', function(err, address) {
      self.closeQR();
      self.address = address;
      cb(err, address);
    });
  }
}

UportSubprovider.prototype.pollForResult = function(apiPath, param, cb) {
  const self = this

  self._intervalId = setInterval( xhr.bind(null, {
    uri: self.chasquiUrl + apiPath,
    method: 'GET',
    rejectUnauthorized: false
  }, function(err, res, body) {
    if (err) return cb(err)

    // parse response into raw account
    var data
    try {
      data = JSON.parse(body)
      if (data.error) return cb(data.error)
    } catch (err) {
      console.error(err.stack)
      return cb(err)
    }
    // Check for param, stop polling and callback if present
    if (data[param]) {
      clearInterval(self._intervalId);
      self.clearChasquiMsg(apiPath);
      return cb(null, data[param]);
    }
  }), 2000);
}

UportSubprovider.prototype.clearChasquiMsg = function(apiPath) {
  const self = this

  xhr({
    uri: self.chasquiUrl + apiPath,
    method: 'DELETE',
    rejectUnauthorized: false
  });
}

UportSubprovider.prototype.validateTransaction = function(txParams, cb){
  const self = this
  self.validateSender(txParams.from, function(err, senderIsValid){
    if (err) return cb(err)
    if (!senderIsValid) return cb(new Error('Unknown address - unable to sign transaction for this address.'))
    cb()
  })
}

UportSubprovider.prototype.validateMessage = function(msgParams, cb){
  const self = this
  self.validateSender(msgParams.from, function(err, senderIsValid){
    if (err) return cb(err)
    if (!senderIsValid) return cb(new Error('Unknown address - unable to sign message for this address.'))
    cb()
  })
}

UportSubprovider.prototype.validateSender = function(senderAddress, cb){
  const self = this

  var senderIsValid = senderAddress === self.address;
  cb(null, senderIsValid)
}

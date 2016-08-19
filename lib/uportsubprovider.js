/*
 * Emulate 'eth_accounts' / 'eth_sendTransaction' using 'eth_sendRawTransaction'
 *
 * The two callbacks a user needs to implement are:
 * TODO - update this
 * - getAccounts() -- array of addresses supported
 * - signTransaction(tx) -- sign a raw transaction object
 */

const async = require('async');
const inherits = require('util').inherits;
const extend = require('xtend');
const Subprovider = require('web3-provider-engine/subproviders/subprovider.js');
const estimateGas = require('web3-provider-engine/util/estimate-gas.js');

module.exports = UportSubprovider;

// handles the following RPC methods:
//   eth_coinbase
//   eth_accounts
//   eth_sendTransaction


inherits(UportSubprovider, Subprovider);

function UportSubprovider(opts){
  const self = this;

  // Chasqui URL (default to standard)
  self.msgServer = opts.msgServer;

  // uportConnectHandler deals with displaying the
  // uport connect data as QR code or clickable link

  self.uportConnectHandler = opts.uportConnectHandler;

  // ethUriHandler deals with displaying the
  // ethereum URI either as a QR code or
  // clickable link for mobile
  self.ethUriHandler = opts.ethUriHandler;

  self.closeQR = opts.closeQR;

  // Set address if present
  self.address = opts.address;
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

    //case 'eth_sign':
      //var address = payload.params[0]
      //var message = payload.params[1]
      //// non-standard "extraParams" to be appended to our "msgParams" obj
      //// good place for metadata
      //var extraParams = payload.params[2] || {}
      //var msgParams = extend(extraParams, {
        //from: address,
        //data: message,
      //})
      //async.waterfall([
        //self.validateMessage.bind(self, msgParams),
        //self.approveMessage.bind(self, msgParams),
        //function checkApproval(didApprove, cb){
          //cb( didApprove ? null : new Error('User denied message signature.') )
        //},
        //self.signMessage.bind(self, msgParams),
      //], end)
      //return

    default:
      next();
    return

  }
}

UportSubprovider.prototype.txParamsToUri = function(txParams, cb) {
  var uri = "ethereum:" + txParams.to;
  if (!txParams.to) {
    return cb(new Error('Contract creation is not supported by uportProvider'))
  }
  if (txParams.value) {
    uri += "?value=" + parseInt(txParams.value, 16);
  }
  if (txParams.data) {
    var symbol = txParams.value ? "&" : "?";
    uri += symbol + "bytecode=" + txParams.data;
  }
  if (txParams.gas) {
    var symbol = txParams.value || txParams.data ? "&" : "?";
    uri += symbol + "gas=" + parseInt(txParams.gas, 16);
  }
  cb(null, uri);
}

UportSubprovider.prototype.signAndReturnTxHash = function(ethUri, cb) {
  const self = this

  var topic = self.msgServer.newTopic('tx');
  ethUri += "&callback_url=" + topic.url;
  self.ethUriHandler(ethUri);
  self.msgServer.waitForResult(topic, function(err, txHash) {
    self.closeQR();
    cb(err, txHash);
  });
}

UportSubprovider.prototype.getAddress = function(cb) {
  const self = this

  if (self.address) {
    cb(null, self.address);
  } else {
    var topic = self.msgServer.newTopic('address');
    var ethUri = "ethereum:me?callback_url=" + topic.url;
    self.uportConnectHandler(ethUri);
    self.msgServer.waitForResult(topic, function(err, address) {
      self.closeQR();
      if (!err) self.address = address;
      cb(err, address);
    });
  }
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

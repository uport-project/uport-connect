/*
 * Autosigner is a simple class that uses lightwallet and acts as a QRDisplay
 * to automatically sign transactions from the uportProvider. This can be used
 * in order to create efficient tests.
 */
const lightwallet = require('eth-lightwallet');
const Transaction = require('ethereumjs-tx');
const Web3 = require('web3');
const url = require('url');
const querystring = require('querystring');
const xhr = process.browser ? require('xhr') : require('request')

module.exports = Autosigner;

const PASSWORD = "password";
const SEED = 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle';


function Autosigner(rpcUrl, keystore, pwDerivedKey) {
  keystore.generateNewAddress(pwDerivedKey);
  this.address = '0x' + keystore.getAddresses()[0];
  this.keystore = keystore;
  this.pwDerivedKey = pwDerivedKey;
  this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
}

Autosigner.load = function(rpcUrl, cb) {
  lightwallet.keystore.deriveKeyFromPassword(PASSWORD, (err, pwDerivedKey) => {
    if (err) cb(err);

    var keystore = new lightwallet.keystore(SEED, pwDerivedKey);
    var autosinger = new Autosigner(rpcUrl, keystore, pwDerivedKey);
    cb(null, autosinger);
  });
}

Autosigner.prototype.openQr = function(data) {
  var res = Autosigner.parse(data);
  var body = {};
  if (res.to === 'me') {
    body.address = this.address;
  } else {
    body.tx = this.sendTx(res);
  }
  setTimeout(
    Autosigner.postData.bind(null, res.callback_url, body),
    3000
  );
}

Autosigner.prototype.sendTx = function(params) {
  var signedTx = this.createAndSignTx(params);
  return this.web3.eth.sendRawTransaction(signedTx);
}

Autosigner.prototype.createAndSignTx = function(params) {
  var txObj = {
    gasPrice: 10000000000000,
    gasLimit: 3000000,
    nonce: this.web3.eth.getTransactionCount(this.address),
  };
  if (params.to) {
    txObj.to = params.to;
  }
  if (params.value) {
    txObj.value = this.web3.toHex(params.value);
  }
  if (params.data) {
    txObj.data = params.data;
  }
  var tx = new Transaction(txObj).serialize().toString('hex');
  return '0x' + lightwallet.signing.signTx(this.keystore, this.pwDerivedKey, tx, this.address);
}

Autosigner.prototype.closeQr = function() {}

Autosigner.parse = function(uri) {
  var parsedUri = url.parse(uri)
  var parsedParams = querystring.parse(parsedUri.query);
  var result = {
    to: parsedUri.host,
    callback_url: parsedParams.callback_url,
    value: parsedParams.value,
    data: parsedParams.bytecode
  };
  if (result.to === "create") {
    result.to = null;
  }
  return result;
}

Autosigner.postData = function(url, body, cb) {
  if (!cb) cb = function(){};
  xhr({
    uri: url,
    method: 'POST',
    rejectUnautohorized: false,
    json: body
  }, cb);
}

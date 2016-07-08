const UportSubprovider = require('./lib/uportsubprovider.js');
const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const randomString = require('./util/randomString.js');
const QRDisplay = require('./util/qrdisplay.js');

module.exports = Uport;

function Uport(dappName, qrDisplay) {
  this.dappName = dappName;
  this.qrdisplay = qrDisplay ? qrDisplay : new QRDisplay();
}

Uport.prototype.getUportProvider = function(rpcUrl) {
  var engine = new ProviderEngine();

  var uportsubprovider = this.getUportSubprovider();
  engine.addProvider(uportsubprovider);

  if (!rpcUrl) {
    rpcUrl = 'https://consensysnet.infura.io:8545';
  }
  // data source
  var rpcSubprovider = new RpcSubprovider({
    rpcUrl: rpcUrl
  });
  engine.addProvider(rpcSubprovider);

  // start polling
  engine.start();
  return engine;
}

Uport.prototype.getUportSubprovider = function() {
  const self = this

  var opts = {
    chasquiUrl: 'http://chasqui.uport.me/',
    uportConnectHandler: function(uri) {
      uri += "&label=" + encodeURI(self.dappName);
      self.qrdisplay.openQr(uri);
    },
    ethUriHandler: function(uri) {
      uri += "&label=" + encodeURI(self.dappName);
      self.qrdisplay.openQr(uri);
    },
    getSessionId: function() { return randomString(16) },
    closeQR: function() {
      self.qrdisplay.closeQr();
    }
  };
  return new UportSubprovider(opts);
}

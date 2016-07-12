const UportSubprovider = require('./lib/uportsubprovider.js');
const MsgServer = require('./lib/msgServer.js');
const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const QRDisplay = require('./util/qrdisplay.js');

module.exports = Uport;

function Uport(dappName, qrDisplay) {
  this.dappName = dappName;
  this.qrdisplay = qrDisplay ? qrDisplay : new QRDisplay();
}

Uport.prototype.getUportProvider = function(rpcUrl, chasquiUrl) {
  var engine = new ProviderEngine();

  if (!chasquiUrl) chasquiUrl = 'https://chasqui.uport.me/';
  var uportsubprovider = this.getUportSubprovider(chasquiUrl);
  engine.addProvider(uportsubprovider);

  // default url for now
  if (!rpcUrl) rpcUrl = 'https://consensysnet.infura.io:8545';
  // data source
  var rpcSubprovider = new RpcSubprovider({
    rpcUrl: rpcUrl
  });
  engine.addProvider(rpcSubprovider);

  // start polling
  engine.start();
  return engine;
}

Uport.prototype.getUportSubprovider = function(chasquiUrl) {
  const self = this

  var opts = {
    msgServer: new MsgServer(chasquiUrl),
    uportConnectHandler: function(uri) {
      uri += "&label=" + encodeURI(self.dappName);
      self.qrdisplay.openQr(uri);
    },
    ethUriHandler: function(uri) {
      uri += "&label=" + encodeURI(self.dappName);
      self.qrdisplay.openQr(uri);
    },
    closeQR: function() {
      self.qrdisplay.closeQr();
    }
  };
  return new UportSubprovider(opts);
}

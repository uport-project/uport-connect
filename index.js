const UportSubprovider = require('./lib/uportsubprovider.js');
const MsgServer = require('./lib/msgServer.js');
const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const QRDisplay = require('./util/qrdisplay.js');
const isMobile = require('is-mobile');

const CHASQUI_URL = 'https://chasqui.uport.me/';
const INFURA_CONSENSYSNET = 'https://consensysnet.infura.io:8545';

module.exports = Uport;

function Uport(dappName, qrDisplay, chasquiUrl) {
  this.dappName = dappName;
  this.qrdisplay = qrDisplay ? qrDisplay : new QRDisplay();
  this.isOnMobile = isMobile(navigator.userAgent);
  this.subprovider = this.createUportSubprovider(chasquiUrl);
}

Uport.prototype.getUportProvider = function(rpcUrl) {
  var engine = new ProviderEngine();

  engine.addProvider(this.subprovider);

  // default url for now
  if (!rpcUrl) rpcUrl = INFURA_CONSENSYSNET;
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
    return self.subprovider;
}

Uport.prototype.createUportSubprovider = function(chasquiUrl) {
  const self = this

  if (!chasquiUrl) chasquiUrl = CHASQUI_URL;

  var opts = {
    msgServer: new MsgServer(chasquiUrl, self.isOnMobile),
    uportConnectHandler: self.handleURI.bind(self),
    ethUriHandler: self.handleURI.bind(self),
    closeQR: self.qrdisplay.closeQr.bind(self.qrdisplay)
  };
  return new UportSubprovider(opts);
}

Uport.prototype.handleURI = function(uri) {
  self = this;
  uri += "&label=" + encodeURI(self.dappName);
  if (self.isOnMobile) {
    location.assign(uri);
  } else {
    self.qrdisplay.openQr(uri);
  }
}


const UportSubprovider = require('./lib/uportsubprovider.js');
const ProviderEngine = require('web3-provider-engine');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const randomString = require('./util/randomString.js');

module.exports = Uport;

function Uport(dappName) {
    this.dappName = dappName;
}

Uport.prototype.setWeb3 = function(web3) {
    var engine = new ProviderEngine();

    var opts = {
        chasquiUrl: 'http://chasqui.uport.me/',
        uportConnectHandler: function(apiPath, cb) {
            console.log('apiPath: ' + apiPath);
        },
        ethUriHandler: function(ethUri, apiPath, cb) {
            console.log('ethUri: ' + ethUri);
            console.log('apiPath: ' + apiPath);
        },
        getSessionId: function() { return randomString(16) },
        closeQR: function() { console.log("Closing QR-code") }
    };
    var uportsubprovider = new UportSubprovider(opts);
    engine.addProvider(uportsubprovider);


    var rpcProviderUrl = 'https://consensysnet.infura.io:8545';
    if (web3.currentProvider) {
        rpcProviderUrl = web3.currentProvider.host;
    }

    // data source
    var rpcSubprovider = new RpcSubprovider({
    rpcUrl: rpcProviderUrl
    });
    engine.addProvider(rpcSubprovider);

    // start polling
    engine.start();
    web3.setProvider(engine);
}

 //// log new blocks
 //engine.on('block', function(block){
   //console.log('================================')
   //console.log('BLOCK CHANGED:', '#'+block.number.toString('hex'), '0x'+block.hash.toString('hex'))
   //console.log('================================')
 //})




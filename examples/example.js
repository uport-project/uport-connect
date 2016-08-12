
var Web3 = require('web3')

var web3 = new Web3();

//web3.setProvider(new web3.providers.HttpProvider(

var statusContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"type":"function"}]);
var status = statusContract.at("0x60dd15dec1732d6c8a6125b21f77d039821e5b93");


var Uport = require('./index.js')

var uport = new Uport("Simple example")

//var uportProvider = uport.getUportProvider("http://localhost:8545");
var uportProvider = uport.getUportProvider();
web3.setProvider(uportProvider);

web3.eth.getCoinbase(function(err, address) {
  console.log("address: " + address)
  web3.eth.defaultAccount = address

  //web3.eth.sendTransaction({value: 10, to: '0xd611e4d19949ceb79ee04c88aff5fc6c879e0e1e'}, function(err, txHash) {
  //console.log("txHash: " + txHash);
  //});

  status.updateStatus("lalalalla", function(e, r) {
    console.log("Waiting for tx to be mined.");

    waitForMined(r, {blockNumber: null});
  })
});

var waitForMined = function(txHash, res) {
  console.log(res)
  if (res.blockNumber) {
    status.getStatus.call(web3.eth.defaultAccount, function(e, r) {
      console.log("My status is: " + r);
    });
  }
  else {
    web3.eth.getTransaction(txHash, function(e, r) {
      waitForMined(txHash, r);
    });
  }
}

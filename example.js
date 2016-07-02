
var Web3 = require('web3')

var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));

var Uport = require('./index.js')

var uport = new Uport()

uport.setWeb3(web3)


web3.eth.getCoinbase(function(err, address) {
    console.log("address: " + address)
    web3.eth.defaultAccount = address

    web3.eth.sendTransaction({value: 10, to: '0xd611e4d19949ceb79ee04c88aff5fc6c879e0e1e', data: "0x875765ab3e"}, function(err, txHash) {
        console.log("txHash: " + txHash);
    });
});


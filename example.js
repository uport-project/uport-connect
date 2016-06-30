
var Web3 = require('web3')

var web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));

var Uport = require('./index.js')

var uport = new Uport()

uport.setWeb3(web3)


web3.eth.getAccounts(function(err, res) {
    console.log(res)
});


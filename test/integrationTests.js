const assert = require('chai').assert;
const Web3 = require('web3');
const Uport = require('../index.js');
const Autosigner = require('../util/autosigner.js');

var rpcUrl = "http://localhost:8545";
var web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

// create random address
var chars = '0123456789abcdef';
var addr1 = '0x';
for (var i = 40; i > 0; --i) addr1 += chars[Math.floor(Math.random() * chars.length)];
var autosinger;
var status;

describe("uport-lib integration tests", function() {
  this.timeout(10000);

  before((done) => {
    global.navigator = {};
    // Create Autosigner
    Autosigner.load(rpcUrl, (err, as) => {
      autosinger = as;
      web3.eth.getAccounts((err, accounts) => {
        // Create status contract
        var statusContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"type":"function"}]);
        status = statusContract.new({
          data: "0x6060604052610253806100126000396000f3606060405260e060020a60003504632c215998811461002657806330ccebb5146100ed575b005b60206004803580820135601f810184900490930260809081016040526060848152610024946024939192918401918190838280828437509496505050505050503373ffffffffffffffffffffffffffffffffffffffff1660009081526020818152604082208351815482855293839020919360026001821615610100026000190190911604601f908101939093048201929091906080908390106101e857805160ff19168380011785555b506101e39291505b8082111561021857600081556001016100d9565b6101756004356000606081815273ffffffffffffffffffffffffffffffffffffffff831682526020828152604092839020805460a0601f600260001961010060018616150201909316929092049182018490049093028301909452608084815292939091828280156102475780601f1061021c57610100808354040283529160200191610247565b60405180806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600f02600301f150905090810190601f1680156101d55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b505050565b828001600101855582156100d1579182015b828111156100d15782518260005055916020019190600101906101fa565b5090565b820191906000526020600020905b81548152906001019060200180831161022a57829003601f168201915b5050505050905091905056",
          from: accounts[0]
        });
        // Send ether to Autosigner
        web3.eth.sendTransaction({from: accounts[0], to: autosinger.address, value: web3.toWei(100)}, () => {
          // Change provider
          // Autosigner is a qrDisplay that automatically signs transactions
          var uport = new Uport("Integration Tests", autosinger);
          var uportProvider = uport.getUportProvider(rpcUrl);
          web3.setProvider(uportProvider);
          done();
        });
      });
    });
  });

  it("getCoinbase", (done) => {
    web3.eth.getCoinbase((err, address) => {
      assert.equal(address, autosinger.address);
      // set the default account
      web3.eth.defaultAccount = address;
      done();
    });
  });

  it("getAccounts", (done) => {
    web3.eth.getAccounts((err, addressList) => {
      assert.equal(addressList.length, 1, "there should be just one address");
      assert.equal(addressList[0], autosinger.address);
      done();
    });
  });

  it("sendTransaction", (done) => {
    web3.eth.sendTransaction({value: web3.toWei(2), to: addr1}, (err, txHash) => {
      web3.eth.getBalance(addr1, (err, balance) => {
        assert.equal(balance.toNumber(), web3.toWei(2));
        done();
      });
    });
  });

  it("use contract", (done) => {
    var coolStatus = "Writing some tests!";
    status.updateStatus(coolStatus, (err, res) => {
      assert.isNull(err);
      status.getStatus.call(web3.eth.defaultAccount, (err, myStatus) => {
        assert.isNull(err);
        assert.equal(myStatus, coolStatus);
        done();
      });
    });
  });
});

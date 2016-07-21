# uport-lib
Main uPort library
Uport has a system in which the users keys are kept securely on the users phone. Thus we need to send all transactions to the phone for the user to sign them. This is accomplished by showing the user a QR code for each transaction, the user can then verify the transaction on the phone and send it to the ethereum network. In order to make this flow easy for developers uport-lib provides a custom web3 provider which takes care of all of this.

Right now there are two libraries you want to use for integrating uport. This library, uport-lib, is used for signing transactions, while the [uport-persona](https://github.com/ConsenSys/uport-persona) library is used for getting information on users.

## Using uport in your dapp
Integrating uport into your dapp is simple. You only need to use the web3 provider given by the uport-lib instead of the regular one. You can use any rpc url that works with the regular provider.
```
var web3 = new Web3();
var uport = new Uport("My dapp name");
var rpcUrl = "http://localhost:8545";
var uportProvider = uport.getUportProvider(rpcUrl);
web3.setProvider(uportProvider);
```
From now you can use the web3 object as normal. The following calls will show a QR code for the user to scan:
* `web3.eth.getCoinbase()`
* `web3.eth.getAccounts()`
* `web3.eth.sendTransaction(txObj)`
* `myContract.myMethod()`

Check out `example.html` for a simple example of how to integrate uport in your dapp.

### Custom display of QR codes
uport-lib features a default QR display function, but you might want to display the qr code in another way. This is simply acheived by doing the following:
```
var qrDisplay = {
  openQr(data) {...},
  closeQr() {...}
};
var uport = new Uport("My dapp name", qrDisplay);
```
The `openQr` function is called each time some information needs to get to the phone. The `closeQr` is called once the phone has taken an action on the data in the QR code.

## Testing
Make sure you have an instance of testrpc running, then do
```
$ npm test
```

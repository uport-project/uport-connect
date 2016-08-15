![uport](https://ipfs.pics/ipfs/QmVHY83dQyym1gDWeMBom7vLJfQ6iGycSWDYZgt2n9Lzah)

<!--[![NPM version][npm-image]][npm-url] [![Gitter chat][gitter-image]][gitter-url] [![Downloads][downloads-image]][downloads-url]-->

<!--[![NPM][nodei-image]][nodei-url]-->

<!--build-->
<!--[![Build Status][travis-image]][travis-url] [![Appveyor Status][appveyor-image]][appveyor-url]  [![Coverage Status][coveralls-image]][coveralls-url]-->

<!--dependencies-->
<!--[![Dependency Status][david-image]][david-url] [![devDependency Status][david-dev-image]][david-dev-url] [![peerDependency Status][david-peer-image]][david-peer-url]-->

<!--donation-->
<!--[![gratipay donate button][gratipay-image]][gratipay-url] [![Donate to sokra][donate-image]][donate-url]-->

<!--[![BADGINATOR][badginator-image]][badginator-url]-->

<!--[documentation](https://webpack.github.io/docs/?utm_source=github&utm_medium=readme&utm_campaign=top)-->

# Introduction

**Uport** is a client-side library in which the end-user's keys are kept securely on their phone. Thus, we need to send all transactions to the phone for the user to sign them.

This is accomplished by showing the user a QR-code for each transaction, the user can then verify the transaction on the phone and send it to the Ethereum network.

In order to make this flow easy for developers, `uport-lib` provides a custom web3 provider which takes care of all of this.

Right now there are two libraries you want to use for integrating uport.

This library, `uport-lib`, is used for signing transactions, while the [uport-persona](https://github.com/ConsenSys/uport-persona) library is used for getting information on users.

These libraries will soon be combined for a simplified developers experience.

## Using uport in your dapp
Integrating **uport** into your DApp is simple.

You only need to use the `web3` provider given by the `uport-lib` instead of the regular `web3` library.

You can use any rpc url that works with the regular provider.

```
let web3   = new Web3();
let uport  = new Uport("My dapp name");

let rpcUrl = "http://localhost:8545";
let uportProvider = uport.getUportProvider(rpcUrl);

web3.setProvider(uportProvider);
```

After the above setup, you can now use the `web3` object as normal.

The following calls will show a QR code for the user to scan:

* `web3.eth.getCoinbase()` - returns your uport address
* `web3.eth.getAccounts()`- returns your uport address in a list
* `web3.eth.sendTransaction(txObj)` - returns a transaction hash
* `myContract.myMethod()` - returns a transaction hash

Check out the examples folder for how to integrate **uport** in your DApp

### Custom display of QR codes
`uport-lib` features a default QR-code display function, but you might want to display the QR-code in another way.

This is simply acheived by doing the following:

```
let qrDisplay = {
  openQr(data) { // your code here },
  closeQr()    { // your code here }
}

const uport = new Uport("My dapp name", qrDisplay);
```

The `openQr` function is called each time some information needs to get to the phone.

The `closeQr` is called once the phone has taken an action on the data in the QR-code.

## Testing
To test, make sure `ethereumjs-testrpc` is installed and running, then you can run `npm test`

```
$ npm install -g ethereumjs-testrpc
$ testrpc
```

then

```
$ npm test
```

<!--
[![uport][uport-image]][uport-url]
[![uport chat][gitter-image]][gitter-url]
-->

<!--npm-->
<!--
  [![NPM version][npm-image]][npm-url]
  [![Downloads][downloads-image]][downloads-url]
  [![NPM][nodei-image]][nodei-url]
-->

<!--build-->
<!--
  [![Build Status][travis-image]][travis-url]
  [![Appveyor Status][appveyor-image]][appveyor-url]
  [![Coverage Status][coveralls-image]][coveralls-url]
-->

<!--dependencies-->
<!--
  [![Dependency Status][david-image]][david-url]
  [![devDependency Status][david-dev-image]][david-dev-url]
  [![peerDependency Status][david-peer-image]][david-peer-url]
-->

# Introduction

**Uport** is a system for self-sovereign digital identity.

This is the client side library that is used to interact with the mobile application where the end-user's keys are stored.

Signing transactions thus requires that the transactions are sent to the phone where they can be signed.
This is accomplished by showing the user a QR-code for each transaction.
The user can then verify the transaction on the phone and send it to the Ethereum network.

In order to make this flow easy for developers, `uport-connect` provides a custom web3 provider which takes care of all of this.

---------------------------------------------

## Using uPort in your Application

### Getting Started

First we will instantiate the Uport object.

```javascript
import { Uport } from 'uport-connect'

const uport = new Uport('MyDApp')
```

To ask the user for their credentials use `requestCredentials()`:

```javascript
uport.requestCredentials().then((credentials) => {
  console.log(credentials)
})
```

If all we want is the address of the connected user we can use `connect()`:

```javascript
uport.connect().then((address) => {
  console.log(address)
})
```

### Using with web3

We provide a convenience method to create a uPort enabled version of the web3 object:

```javascript
let web3 = uport.getWeb3()
```

After the above setup, you can now use the `web3` object as normal.

Also, the following calls will show a QR code for the user to scan:

* `web3.eth.getCoinbase()` - returns your uport address
* `web3.eth.getAccounts()`- returns your uport address in a list
* `web3.eth.sendTransaction(txObj)` - returns a transaction hash
* `myContract.myMethod()` - returns a transaction hash

Check out the examples folder too for how to integrate **uport** in your DApp

---------------------------------------------

### Customizing QR code requests

`uport-connect` features a default QR-code display function, which injects a `<div>` containing the QR-code into the DOM.
However, you might want to display the QR-code in a different way.

You can provide your own `showHandler` function which can be used to handle it your self using your own frontend library.

```js
const uport = new Uport('MyDApp', { 
  showHandler: (uri) => {
    // show URI handler or button to send user to mobile app
  }
})
```

---------------------------------------------


## Contributing
#### Testing / Building (& watching) / Docs

This basic commands can be found in `package.json -> scripts: { }` for contributing to the library.

#### npm install from Github

To install this package from Github and the develop branch:
```bash
$ npm install "git://github.com/uport-project/uport-connect.git#develop" --save
$ (cd node_modules/uport-connect && npm install babel-cli && npm run prepublish)
```

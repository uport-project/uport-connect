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

For additional documentation on all functionality [visit our docs](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md). For a quick start read below.

### Getting Started

First we will instantiate the Uport object.

```javascript
import { Connect } from 'uport-connect'

const uport = new Connect('MyDApp')
```

To ask the user for their credentials use `requestCredentials()`:

```javascript
uport.requestCredentials().then((credentials) => {
  console.log(credentials)
})
```

If all we want is the address of the connected user we can use `requestAddress()`:

```javascript
uport.requestAddress().then((address) => {
  console.log(address)
})
```

For use directly in the browser you can reference the uport-connect distribution files from a number of places. They can be found in our npm package in the 'dist' folder or you can build them locally from this repo.

For a quick setup you may also request a remote copy from [unpkg CDN](https://unpkg.com/) as follows:

```html
<!-- The most recent version  -->
<script src="https://unpkg.com/uport-connect/dist/uportconnect.js"></script>
<!-- The most recent minified version  -->
<script src="https://unpkg.com/uport-connect/dist/uportconnect.min.js"></script>
<!-- You can also fetch specific versions by specifying the version -->
<script src="https://unpkg.com/uport-connect@0.4.5/dist/uportconnect.js"></script>
```
Then to instantiate the uPort object from the browser window object:

```js
var uportconnect = window.uportconnect
var uport = new uportconnect.Connect('MyDApp')
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


#### One line Integration to allow users to sign transactions with uPort.

If you already have a dapp this is the quickest way to support uPort for your users. This will inject a uPort web3 object which will use our default transaction signing flows with QR codes and our mobile app.

TODO: more details, works if dapps already support metamask, can not load anything regarding accounts, so maybe this implementation does not make sense.

```html
<button id="uport-activate"> Use uPort </button> <script async src="../dist/uport-connect.js" charset="utf-8"></script>
```
---------------------------------------------

### Customizing QR code requests

`uport-connect` features a default QR-code display function, which injects a `<div>` containing the QR-code into the DOM.
However, you might want to display the QR-code in a different way.

You can provide your own `uriHandler` function which can be used to handle it your self using your own frontend library.

```js
const uport = new Connect('MyDApp', {
  uriHandler: (uri) => {
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

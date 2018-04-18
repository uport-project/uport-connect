[![CircleCI](https://img.shields.io/circleci/project/github/uport-project/uport-connect.svg)](https://circleci.com/gh/uport-project/uport-connect)
[![Join the chat at](https://img.shields.io/badge/Riot-Join%20chat-green.svg)](https://chat.uport.me/#/login)
[![npm](https://img.shields.io/npm/dt/uport-connect.svg)](https://www.npmjs.com/package/uport-connect)
[![npm](https://img.shields.io/npm/v/uport-connect.svg)](https://www.npmjs.com/package/uport-connect)
[![Codecov](https://img.shields.io/codecov/c/github/uport-project/uport-connect.svg)](https://codecov.io/gh/uport-project/uport-connect)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![Twitter Follow](https://img.shields.io/twitter/follow/uport_me.svg?style=social&label=Follow)](https://twitter.com/uport_me)

[Quick Start](#quick-start) | [Tutorial and Examples](#tutorials) | [Usage Guide](#usage-guide) | [Development Guide](#development-guide) | [Contributing](#contribute)

# <a name="introduction"></a> Introduction

**uPort** is a system for self-sovereign digital identity anchored in Ethereum.
The uPort technology primarily consists of smart contracts, developer libraries, and a mobile app. uPort identities are fully owned and controlled by the creator, and don't rely on centralized third-parties for creation, control or validation. In the current implementation of the system this is achievable by having the mobile app act as the primary secure container for data related to your identity and for a set of keys which allow you sign transactions, grant authorization and sign credentials. The identity is anchored in the blockchain with an identifier and public data is stored in IPFS.

`uport-connect` is the client side library that allows you interact with user's uPort identities through the mobile app. It handles the communication channel between your app and the uPort mobile app, which can vary depending on the environment which your application runs. Over this communication channel you can create requests for a user's data, share credentials and generate transactions to be signed in the user's mobile app.

For more information about our system and other products visit [uport.me](https://www.uport.me). View our [whitepaper draft](http://whitepaper.uport.me/uPort_whitepaper_DRAFT20170221.pdf) if interested in understanding all the components of our identity system, how they interact and for the background of why many choices were made. Please be aware this document is rapidly changing at the moment. Our uPort mobile app is currently in a limited alpha release, you can [sign up here](https://www.uport.me/signup) for IOS or Android. If you are interested in partnering with uPort [please reach out here](https://www.uport.me/partners).

For any questions or library support reach out to the [uPort team on gitter](https://gitter.im/uport-project/Lobby) or create a [Github issue](https://github.com/uport-project/uport-connect/issues).

---------------------------------------------

## <a name="getting-started"></a>Getting started with uPort

For additional documentation on all functionality [visit our docs](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md). For a quick start continue below.

For a more interactive quick start visit [developer.uport.me](https://developer.uport.me)

### <a name="quick-start"></a> Quick Start

```shell
npm install uport-connect
```

First we will instantiate the uPort object, by default it is configured on the Rinkeby test network.

```javascript
import { Connect } from 'uport-connect'

const uport = new Connect('MyDApp')
```

To ask the user for their credentials use `requestCredentials()`. With no additional params this will return a user's public profile.

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

### <a name="browser-quick-start"></a> Browser Window Quick Start

For use directly in the browser you can reference the uport-connect distribution files from a number of places. They can be found in our npm package in the 'dist' folder or you can build them locally from this repo.

For a quick setup you may also request a remote copy from [unpkg CDN](https://unpkg.com/) as follows:

```html
<!-- The most recent version  -->
<script src="https://unpkg.com/uport-connect/dist/uport-connect.js"></script>
<!-- The most recent minified version  -->
<script src="https://unpkg.com/uport-connect/dist/uport-connect.min.js"></script>
<!-- You can also fetch specific versions by specifying the version, files names may differ for past versions -->
<script src="https://unpkg.com/uport-connect@<version>/dist/uport-connect.js"></script>
```
To see all available dist files on unpkg, vist [unpkg.com/uport-connect/dist/](https://unpkg.com/uport-connect/dist/)

Then to instantiate the uPort object from the browser window object:

```js
var uportconnect = window.uportconnect
var uport = new uportconnect.Connect('MyDApp')
```

### <a name="tutorials"></a> Tutorial and Examples

For a more in depth quick start example follow our [tutorial for building a simple dapp](https://github.com/uport-project/uport-connect/blob/develop/tutorial/tutorial.md) or locally open the `/tutorial` folder. This simple example will show you how to use our default QR flow to connect and create transactions to send ether or interact with smart contracts.

### <a name="frontend"></a> Frontend Library Specific Fixes
Each Frontend Library React, Angular, Vue, etc... can sometimes require specific configuration settings. To prevent developers from solving the same problems twice we're going document Library specific issues on a case-by-case basis. 

#### <a name="angular"></a> Angular
When adding the `uport-connect.js` library to an Angular project please install the `crypto-browserify` module as a project dependency and create a path alias pointing `crypto` to the `crypto-browserify` module.

This will fix a `crypto.createHash()` undefined error.

```
"paths": {
  "crypto": ["../node_modules/crypto-browserify/index.js"]
}
```
 

#### <a name="frontend-other"></a> Other Frontend Libraries
Are you experiencing other Frontend Library specific issues?

Let us know in <a href="https://github.com/uport-project/uport-connect/issues"> the issues</a>.

---------------------------------------------

## <a name="usage-guide"></a> Usage Guide

The following Connect object is the primary interface you will use. All details and additional documentation can be found in [our docs](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md).

* [Connect](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#Connect) ⇐ <code>[ConnectCore](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore)</code>
    * [new Connect(appName, [opts])](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#new_Connect_new)
    * [.getWeb3()](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#Connect+getWeb3) ⇒ <code>web3</code>
    * [.getProvider()](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore+getProvider) ⇒ <code>[UportSubprovider](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#UportSubprovider)</code>
    * [.requestCredentials([request], [uriHandler])](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore+requestCredentials) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.requestAddress([uriHandler])](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore+requestAddress) ⇒ <code>Promise.&lt;String, Error&gt;</code>
    * [.attestCredentials(credential, [uriHandler])](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore+attestCredentials) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.request(request)](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore+request) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.contract(abi)](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore+contract) ⇒ <code>Object</code>
    * [.sendTransaction(txobj)](https://github.com/uport-project/uport-connect/blob/develop/DOCS.md#ConnectCore+sendTransaction) ⇒ <code>Promise.&lt;Object, Error&gt;</code>

### <a name="communication"></a> Communication

This library manages communication between your application and the mobile app. This communication channel differs depending on the environment in which your app runs and the parameters which you specify. In general, communication consist of a request and a response. This library helps you encode all supported requests. The mobile app understands requests encoded as Uniform Resource Identifier's (URI) with a set of params. These URIs are the strings which must be communicated to the mobile device. All functions which create a request will call a `uriHandler` function which consumes this URI string. This `uriHandler` allows both default and custom means of display and communication.

#### <a name="default-qr"></a> Default QR flow

When the library is loaded on a non-mobile device the library will use QR codes to pass information to the mobile application. To receive a response the library will query a messaging server. You will be able to run your own messaging server or utilize other communication channels, but by default this is provided. We provide a default QR-code display function, which injects a `<div>` containing the QR-code into the DOM. Any function which makes a request to the mobile app will bring up this QR flow.

Using the default QR is the quickest way to start but in many cases you may want to change the QR display, embed the QR codes in different parts of your app, change the display depending on the request, or generate QR codes in once place and show them in another. We provide flexible configs to meet your needs. You can set a default `uriHandler` to be used with every request from the instantiated Connect object or you can can pass a `uriHandler` with each function call which makes a request. The functions which create a request should be clear from the docs.

Instantiate a Connect object with a default `uriHandler`. This URI handler will be called with the request URI on every request.   

```js
const uport = new Connect('MyDApp', {
  uriHandler: (uri) => {
    // ex. show URI handler, create QR code or create a button to send a user to the mobile app
  }
})
```

Every function which creates a request can be given a `uriHandler`. When given a URI handler it will ignore the default `uriHandler` with which the object was instantiated.

```javascript
const uriHandler = (uri) => {
  // ex. show URI handler, create QR code or create a button to send a user to the mobile app
}
uport.requestCredentials({}, uriHandler).then((credentials) => {
  // requestCredentials will call uriHandler with a request encoded as URI string
})
```

URIs are not QR code URIs. If you want to generate a QR code from these request URIs, you can use the following function provided in this library.

```javascript
import { QRUtil } from 'uport-connect'

const uriHandler = (uri) => {
  // Creates a QR code URI, this is also a good place to you used any QR code library you prefer.
  const qrCode = QRUtil.getQRDataURI(uri)
  // A QR cod URI can then be used in a html img tag <img src="${qrCode}"/>
}
```

#### <a name="default-mobile"></a> Default Mobile Requests

By default `uport-connect` will detect if the library is loaded on a mobile device. When on a mobile device it will call the default `mobileUriHandler` function which consumes a URI encoded request. When on a mobile device it assumes that the uPort app is on the same device, it will set the window URL to the request URI which will bring up a prompt to open that URI in the uPort app. To return a response the mobile app will call a URL which encodes the response and return control to the calling app. There is also a great deal of flexibility with the `mobileUriHandler`, the following options may be useful.


Instantiate a Connect object with a default `mobileUriHandler`. This mobile URI handler will be called with the request URI on every request from a mobile device.   

```js
const uport = new Connect('MyDApp', {
  mobileUriHandler: (uri) => { ... }
})
```

If you want all requests to be handled by your own `uriHandler`. For example you many not want to rely on our default device detection and include your own or set different rules. If you know your application will always be run on a particular device, for example in a native app then this is also useful.

```js
const uport = new Connect('MyDApp', {
  isMobile: false
})
// Then set a default uriHandler or pass a uriHandler for each function which makes a request
```

#### <a name="push-notifications"></a> Push Notifications

An alternative means to communicate with a user's uPort app is through push notifications. This requires an initializing request using one of the flow above, then all requests can be made with push notifications. Using push notification requests requires requesting an additional permission from a uPort user. Thus only use push notifications when you believe it improve your app's user experience and/or your application has some limiting factor that necessitates use. (for example requests which are too large to place in a QR code).

```javascript
uport.requestCredentials({
  notifications: true
}).then((credentials) => { ... })
// Then all future requests will use push notifications if permission is granted.
```

### <a name="ethereum"></a> Ethereum Interactions and Transactions

`uport-connect` can be used to create a web3 object wrapped with uPort functionality. If you already have an existing application built on ethereum using web3 then this may be the simplest uPort integration. If you want to use alternatives to web3 then `uport-connect` can create a web3 style provider wrapped with uPort functionality and can be used in any library which supports these providers, for example [ethjs](https://github.com/ethjs/ethjs). If you have no need to use web3, or want more granular control over handling request URIs, then `uport-connect` provides a contract object similar to web3 which can be used to create transactions encoded as URI requests.

#### <a name="web3"></a> Using with web3

We provide a convenience method to create a uPort enabled version of the web3 object:

```javascript
let web3 = uport.getWeb3()
```

After the above setup, you can now use the `web3` object as normal.

The following calls will initiate a uPort request, by default this will show a QR code.

* `web3.eth.getCoinbase()` - returns your uport address, if not set already
* `web3.eth.getAccounts()`- returns your uport address in a list, if not set already
* `web3.eth.sendTransaction(txObj)` - returns a transaction hash
* `myContract.myMethod()` - returns a transaction hash

#### <a name="provider"></a> Using a provider

Create a web3 style provider to use with web3 or other libraries which support these providers. Intercepts the same RPC calls as defined above for the web3 object.

```js
const uportProvider = uport.getProvider()
```

#### <a name="contracts"></a> Contract Object (without web3)

Primary reasons to use this object include; 1) You don't want/need to use web3 2) Using a web3 object will use your default URI handler for every request, if you want different URI handling for different contracts or different contract function calls then you should use this. Each contract function call consumes a `uriHandler` function.

Functionality and use similar to web3 contract object. This contract object is promised based.

```js
  const statusContractABI = [
      {
        "constant": false,
        "inputs": [
          {
            "name": "status",
            "type": "string"
          }
        ],
        "name": "updateStatus",
        "outputs": [],
        "type": "function"
      }
    ]

  const statusContract = uport.contract(statusContractABI)
  const status = statusContract.at("0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087")

  const uriHandler = (uri) => {
    // ex. show URI handler, create QR code or create a button to send a user to the mobile app
  } slack

  status.updateStatus('hello', uriHandler).then(txhash => {
    ...
  })
```
---------------------------------------------

## <a name="development-guide"></a> Development Guide

#### Run Locally

Download this repo or your fork, then run `npm install`.

#### <a name="build"></a> Builds

All builds are created from files in `/src`

To transpile to ES5. All files are output to `/lib`. The entry of our npm package is `/lib/index.js`

```shell
$ npm run build-es5
```

To generate a bundle/distributable. We use webpack for our builds. The output dist is `/dist/uport-connect.js` and source map `/dist/uport-connect.map.js`

```shell
$ npm run build-dist
```

To generate a production bundle/distributable. Includes build optimizations related to size and code is minified. The output dist is `/dist/uport-connect.min.js` and source map `/dist/uport-connect.min.map.js`

```shell
$ npm run build-dist-prod
```

#### <a name="test"></a> Tests

We write our tests using [mocha](http://mochajs.org) and run them with [karma](https://karma-runner.github.io/1.0/index.html). [TestRPC](https://github.com/ethereumjs/testrpc) runs in the background during tests.

To run our tests:

```shell
$ npm run karma
```

#### <a name="coverage"></a> Code Coverage

Code coverage reports are generated when tests are run and can be viewed in browser. Reports are also published on [CodeCov](https://codecov.io/gh/uport-project/uport-connect) when pushed to github.

```shell
$ npm run karma
$ open test/coverage/html/index.html
```

#### <a name="lint"></a> Linting

Run our linter, we follow [JavaScript Standard Style](http://standardjs.com/).

```shell
$ npm run lint
```
#### <a name="docs"></a> Documentation

We write inline documentation using [JSDoc](http://usejsdoc.org). To generate docs:

```shell
$ npm run build:docs:html
$ open docs/index.html
```
```shell
$ npm run build:docs:md // to generate a DOCS.md markdown file
```

#### <a name="scripts"></a> Scripts

Additional scripts can be found in `package.json -> scripts: { }`.


#### <a name="versioning"></a> Versioning

We follow MAJOR.MINOR.PATCH [Semantic Versioning](http://semver.org)


#### <a name="npm-install"></a> NPM Install Develop branch

You can npm install the develop branch of uport-connect using the follow commands.

```shell
$ npm install "git://github.com/uport-project/uport-connect.git#develop" --save
$ (cd node_modules/uport-connect && npm install babel-cli && npm run prepublish)
```

## <a name="contribute"></a> Contributing

Code, test and documentation contributions are welcomed and encouraged. Please read the guidelines below and reach out on [gitter](https://gitter.im/uport-project/Lobby) or create an [issue](https://github.com/uport-project/uport-connect/issues) if any contribution is more than trivial. We can help you see where/if it fits into our roadmap and if we are likely to accept. We are also looking to add references to projects using `uport-connect` with example implementations and use cases.

#### <a name="bugs"></a> Reporting Bugs

Well formed bug reports are hugely valuable to the project and allow us quickly evaluate and fix a bug. Poorly formed bug reports leave use searching for more details and even worse may leave us trying to resolve bugs not related to the code here. Primarily be thoughtful when submitting bugs and leave enough details to minimize the paths we have to take when finding a resolution. Report bugs by creating an [issue](https://github.com/uport-project/uport-connect/issues).

Some guidelines for reporting bugs:

- Make sure that your issue is caused by uport-connect and not your application code.
- Create a simple and minimal test case that demonstrates the bug.
- Search the issues to see if the bug has already been reported. If it has, add any additional details in the comments.
- Write a descriptive and specific title.
- Include browser, OS, uport-connect version and any other details specific to the environment.
- Check whether the bug can be reproduced in other environments (ie. other browsers).

#### <a name="code"></a> Contributing code

Our `master` branch reflects our most recent release, while we accept pull requests from topic branches into our `develop` branch. To submit code for a feature, bug or documentation, [fork this repo](https://help.github.com/articles/fork-a-repo/) and add all related commits to a topic branch (feature/your-title, fix/your-title, doc/your-title, etc). Once ready for review, open a pull request to merge into `develop`.

All commits are required to be well formed. We follow the [AngularJS Commit Message Conventions](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit). We use these commit messages to create a useful history, generate CHANGELOGS and to determine release versions.

Before submitting your changes run `npm run lint` to find any formatting issues that don't adhere to the original codebase. Run `npm run karma` to be sure all tests pass. When submitting a bug fix try to add additional tests to cover that bug or similar bugs in the future. If a bug was specific to an environment consider adding a environment specific note in the docs. When submitting code for a new feature or functionality add the relevant documentation and test coverage as well.

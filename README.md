[![CircleCI](https://img.shields.io/circleci/project/github/uport-project/uport-connect.svg)](https://circleci.com/gh/uport-project/uport-connect)
[![Join the chat at](https://img.shields.io/badge/Riot-Join%20chat-green.svg)](https://chat.uport.me/#/login)
[![npm](https://img.shields.io/npm/dt/uport-connect.svg)](https://www.npmjs.com/package/uport-connect)
[![npm](https://img.shields.io/npm/v/uport-connect.svg)](https://www.npmjs.com/package/uport-connect)
[![Codecov](https://img.shields.io/codecov/c/github/uport-project/uport-connect.svg)](https://codecov.io/gh/uport-project/uport-connect)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![Twitter Follow](https://img.shields.io/twitter/follow/uport_me.svg?style=social&label=Follow)](https://twitter.com/uport_me)

[Quick Start](#quick-start) | [Tutorial and Examples](#tutorials) | [Usage Guide](#usage-guide) | [Development Guide](#development-guide) | [Contributing](#contribute)


# <a name="introduction"></a> Introduction

**Required Upgrade to v0.7.5 to support new uPort Clients - [View Details](https://github.com/uport-project/uport-connect/releases/tag/v0.7.5)**

**uPort** is a system for self-sovereign digital identity anchored in Ethereum.
The uPort technology primarily consists of smart contracts, developer libraries, microservices and uPort clients including our mobile app. uPort identities are fully owned and controlled by the creator, and don't rely on centralized third-parties for creation, control or validation. In the current implementation of the system this is achievable by having the mobile app act as the primary secure container for data related to your identity and for a set of keys which allow you sign transactions, grant authorization and sign credentials. The identity is anchored in the blockchain with an identifier and public data is stored in IPFS.

`uport-connect` is the client side library that allows you interact with user's uPort identities through a uPort client, primarily the mobile app. It handles the communication channel between your app and a uPort client, which can vary depending on the environment which your application runs. Over this communication channel you can send requests for a user's data, share credentials, generate transactions to be signed by a user and relay requests you originally created on your server with [uport-js](https://github.com/uport-project/uport-js). This library offers the default quick start implementation to integrate with uPort, but if it doesn't offer exactly what you need, you may be interested in using [uport-core-js](https://github.com/uport-project/uport-core-js) and [uport-js](https://github.com/uport-project/uport-js) instead.

For more information about our system and other products visit [uport.me](https://www.uport.me). View our [protocol specs](https://github.com/uport-project/specs/) if interested in understanding some of the lower level details.

For any questions or library support reach out to the [uPort team on riot](https://chat.uport.me/#/login) or create a [Github issue](https://github.com/uport-project/uport-connect/issues).

---------------------------------------------

## <a name="getting-started"></a>Getting started with uPort

For additional documentation on all functionality [visit our docs](https://github.com/uport-project/uport-connect/blob/develop/docs/reference/index.md). For a more interactive intro visit [developer.uport.me](https://developer.uport.me/gettingstarted). For a quick start continue below.

### <a name="quick-start"></a> Quick Start

```shell
npm install uport-connect
```

First we will instantiate the uPort object, by default it is configured on the Rinkeby test network.

```javascript
import Connect from 'uport-connect'
const uport = new Connect('MyDAppName')
```

To request the ID and address of user use `requestAddress()`:

```javascript
uport.requestAddress()
uport.onResponse('addressReq').then(payload => {
  const address = payload.res.address
  // or
  // const address = uport.address
  // const doc = uport.doc
  // TODO Show whats in the doc
})
```

To send a request token you created on your server or elsewhere use `request()`:

```javascript
const requestToken = `eyJ0eXAiOiJKV1QiLCJhbG...`
uport.request(token, 'myRequestID')
uport.onResponse('myRequestId').then(payload => {
  // Response is available now, handle as necessary to your implementation
  // If the response was returned your server, you may poll for it now
})
```

To create a transaction request use `contract()` or `sendTransaction()`:

```javascript
const abi = [{"constant": false,"inputs": [{"name": "status","type": "string"}],"name": "updateStatus","outputs": [],"type": "function"}]
const contractAddress = '0x71845bbfe5ddfdb919e780febfff5eda62a30fdc'
const statusContract = uport.contract(abi).at(contractAddress)

statusContract.updateStatus('hello', 'updateStatusReq')
uport.onResponse('updateStatusReq').then(payload => {
  const txId = payload.res
})
```

```javascript
const txObj = {
  address: '0x71845bbfe5ddfdb919e780febfff5eda62a30fdc',
  value: 1 * 1.0e18
}
uport.sendTransaction(txObj, 'ethSendReq')
uport.onResponse('ethSendReq').then(payload => {
  const txId = payload.res
})
```
### <a name="quick-start"></a> Quick Start with Provider (web3)

Get provider and instantiate web3 or other provider supported library.

```javascript
const provider = uport.getProvider()
const web3 = new Web3(provider)
```

To request the address of user:

```javascript
web3.eth.getCoinbase((error, address) => { ... })
```

To call contract:
```javascript
const statusContract = web3.eth.contract(abi).at(contractAddress)
statusContract.updateStatus('hello', (error, txHash) => { ... })
```

To send transaction:
```javascript
web3.eth.sendTransaction(txObj, (error, txHash) => {...})
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
var Connect = window.uportconnect
var uport = new Connect('MyDApp')
```

### <a name="tutorials"></a> Tutorial and Examples

For a more in depth quick start example follow our [tutorial for building a simple dapp](https://github.com/uport-project/uport-connect/blob/develop/tutorial/tutorial.md) or locally open the `/examples` folder. This simple example will show you how to use our default QR flow to connect and create transactions to send ether or interact with smart contracts.

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
$ npm run build:docs:md // to generate a markdown file in /docs folder
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


## <a name="contribute"></a> Contributing

Code, test and documentation contributions are welcomed and encouraged. Please read the guidelines below and reach out on our [riot](https://chat.uport.me/#/login) or create an [issue](https://github.com/uport-project/uport-connect/issues) if any contribution is more than trivial. We can help you see where/if it fits into our roadmap and if we are likely to accept. We are also looking to add references to projects using `uport-connect` with example implementations and use cases.

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

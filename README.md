[![CircleCI](https://img.shields.io/circleci/project/github/uport-project/uport-connect.svg)](https://circleci.com/gh/uport-project/uport-connect)
[![Join the chat at](https://img.shields.io/badge/Riot-Join%20chat-green.svg)](https://chat.uport.me/#/login)
[![npm](https://img.shields.io/npm/dt/uport-connect.svg)](https://www.npmjs.com/package/uport-connect)
[![npm](https://img.shields.io/npm/v/uport-connect.svg)](https://www.npmjs.com/package/uport-connect)
[![Codecov](https://img.shields.io/codecov/c/github/uport-project/uport-connect.svg)](https://codecov.io/gh/uport-project/uport-connect)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![Twitter Follow](https://img.shields.io/twitter/follow/uport_me.svg?style=social&label=Follow)](https://twitter.com/uport_me)

[Quick Start](#quick-start) | [Tutorial and Examples](#tutorials) | [Usage Guide](#usage-guide) | [Development Guide](#development-guide) | [Contributing](#contribute)

**Required Upgrade v1.0.0 or ^0.7.5**

**^0.7.5 to support new both new uPort Mobile Clients and legacy uPort Mobile Clients - [View Details](https://github.com/uport-project/uport-connect/releases/tag/v0.7.5)**

**v1.0.0 to support only new uPort Mobile Clients and to use new features and fixes**

:bangbang: :warning: **v1.0.0** is released at the npm next tag at **uport-connect@next**. Only the newest uPort Mobile Client release will work with **v1.0.0**. It will become the default release once the newest uPort Mobile Client release is widely adopted (~ 2 weeks). Reference master branch for docs and info on current default release **v0.7.5**. Documentation for **v1.0.0** can only be found here and in the docs folder. The [developer site](https://developer.uport.me) will not contain **v1.0.0** documentation until it is the default release :warning: :bangbang:

# <a name="introduction"></a> Introduction

**uPort** is a collection of tools and protocols for building decentralized user-centric applications. It is built on open standards and open source libraries. uPort identities can be created and interacted with through uPort clients, including the uPort mobile app. Identities are fully owned and controlled by the creator, and don't rely on centralized third-parties for creation, control or validation.

`uport-connect` is the client side library that allows you interact with a user's uPort identity through a uPort client, primarily the mobile app. It handles the communication channel between your app and a uPort client, which can vary depending on the environment which your application runs. Over this communication channel you can send requests for a user's data, share credentials, generate transactions to be signed by a user and relay requests you originally created on your server with [uport-credentials](https://github.com/uport-project/uport-credentials). This library offers the default quick start implementation to integrate with uPort, but if it doesn't offer exactly what you need, you may be interested in using [uport-tranports](https://github.com/uport-project/uport-transports) and [uport-credentials](https://github.com/uport-project/uport-credentials) instead.

For more information about our system and other products visit [uport.me](https://www.uport.me). View our [protocol specs](https://github.com/uport-project/specs/) if interested in understanding the lower level details.

For any questions or library support reach out to the [uPort team on riot](https://chat.uport.me/#/login) or create a [Github issue](https://github.com/uport-project/uport-connect/issues).

---------------------------------------------

## <a name="getting-started"></a>Getting started with uPort

For additional documentation on all functionality [visit our docs](https://github.com/uport-project/uport-connect/blob/develop/docs/reference/index.md). For a more interactive intro visit [developer.uport.me](https://developer.uport.me/gettingstarted). For a quick start continue below.

### <a name="quick-start"></a> Quick Start

```shell
npm install uport-connect
```

First we will instantiate the uPort object, by default it is configured on the Rinkeby test network, reference the docs for additional config arguments which can be passed.

```javascript
import { Connect } from 'uport-connect'
const uport = new Connect('MyDAppName')
// or on mainnet
// const uport = new Connect('MyDAppName', {network: 'mainnet'})
```

To request the DID and address of user use `requestDisclosure()`:

```javascript
uport.requestDisclosure()

uport.onResponse('disclosureReq').then(res => {
  const did = res.payload.did
  ...
})
```

Or to request addtional credentials, along with the DID.

```javascript
const reqObj = { requested: ['name', 'country'],
                  notifications: true }

uport.requestDisclosure(reqObj)

uport.onResponse('disclosureReq').then(res => {
  const did = res.payload.did
  const verified = res.payload.verified // An array of shared verified credentials, matching requested
  ...
})
```

uPort Connect will save session data and data from prior requests to localStorage and will load it on instantiation. You can check if it is available before creating a selective disclosure request again.

```javascript
if (uport.did) {
  // Already connected, reference docs to see data which will be available
} else {
  // Create a request if necessary
}
```

To send a request message (JWT) you created on your server or elsewhere use `send()`:

```javascript
const reqID = 'myRequestID'
const request = `eyJ0eXAiOiJKV1QiLCJhbG...`
uport.send(request, reqID)
uport.onResponse(reqID).then(payload => {
  // Response is available now, handle as necessary to your implementation
  // If the response was returned your server, you may poll for it now
})
```

To request a user to sign a claim

```javascript
const unsignedClaim = {
    "Citizen of city X": {
      "Allowed to vote": true,
      "Document": "QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmPW"
    }
}

const sub ="did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54"

uport.requestVerificationSignature(unsignedClaim, sub)

uport.onResponse('verSigReq').then(res => {
  const signedClaim = res.payload
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
uport.onResponse('ethSendReq').then(res => {
  const txId = res.payload
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

### Private Chain support

While the primary uPort Credentials functionality does not tie you to any specific blockchain. You are able to request ethereum accounts for use with private ethereum compatible chains. You will need a network ID and a JSON-RPC endpoint accessible to both your browser app and the mobile client.

To configure it, pass in a network object for configuration.

```javascript
const uport = new Connect('MyDAppName', {
  network: {
    id: '0xdeadbeef',
    rpcUrl: 'https://mybankrpc.example.com/'
  }
})
const provider = uport.getProvider()
const web3 = new Web3(provider)
web3.eth.getCoinbase((error, address) => { ... }) // request address for use on private chain
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
const Connect = window.uportconnect
const uport = new Connect('MyDApp')
```

### <a name="tutorials"></a> Tutorials and Developer Site

For a more in depth guide, check out our [developer site](https://developer.uport.me/uport-connect/guides/usage) or clone this repository and check out the sample apps in the `/examples` folder.

---------------------------------------------

## <a name="development-guide"></a> Development Guide

#### Run Locally

Download this repo or your fork, then run `npm install`.

#### <a name="build"></a> Builds

All builds are created from files in `/src`

To transpile to ES5. All files are output to `/lib`. The entry of our npm package is `/lib/Connect.js`

```shell
$ npm run build:es5
```

To generate a bundle/distributable. We use webpack for our builds. The output dist is `/dist/uport-connect.js` and source map `/dist/uport-connect.map.js`

```shell
$ npm run build:dist
```

To generate a production bundle/distributable. Includes build optimizations related to size and code is minified. The output dist is `/dist/uport-connect.min.js` and source map `/dist/uport-connect.min.map.js`

```shell
$ npm run build:dist:prod
```

#### <a name="test"></a> Tests

We write our tests using [mocha](http://mochajs.org) and run them with [karma](https://karma-runner.github.io/1.0/index.html).

To run our tests:

```shell
$ npm test
```

#### <a name="coverage"></a> Code Coverage

Code coverage reports are generated when tests are run and can be viewed in browser. Reports are also published on [CodeCov](https://codecov.io/gh/uport-project/uport-connect) when pushed to github.

```shell
$ npm test
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

---
title: "uPort Connect Usage Guide"
index: 4
category: "tutorials"
type: "content"
---

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

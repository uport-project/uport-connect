---
title: "Connect Library"
index: 2
category: "guides"
type: "content"
source: "https://github.com/uport-project/uport-connect/blob/develop/docs/guides/usage.md"
---

# <a name="usage-guide"></a> Connect Library Guide

The uPort Connect library is a client side library that allows you interact with a user's uPort identity through a uPort client, primarily the uPort mobile app. It bundles functionality from our other libraries in to a singular, easy to use interface.

This guide describes the parts which make up Connect and provides further details on how to configure it for your specific use case. While Connect is likely the best integrated solution for most use cases, you may decide you need greater optionality and control over certain use cases, in that situation, you may be interested in using [uport-tranports](https://github.com/uport-project/uport-transports) and [uport-credentials](https://github.com/uport-project/uport-credentials) as an alternative.

The following Connect object is the primary interface you will use. All details and additional documentation can be found in [our docs](https://developer.uport.me/uport-connect/reference/index). There is additional helper functions not referenced here, which can also be found in the docs.

* [Connect]() ⇐ <code>[Connect]()</code>
    * [new Connect(appName, [opts])](#new_Connect_new)
    * [.requestDisclosure([reqObj], [id])](#Connect+requestDisclosure)
    * [.getProvider()](#Connect+getProvider) ⇒ <code>UportSubprovider</code>
    * [.contract(abi)](#Connect+contract) ⇒ <code>Object</code>
    * [.createVerificationRequest(reqObj, [id])](#Connect+createVerificationRequest)
    * [.attest([credential], [id])](#Connect+attest)
    * [.send(request, id, [opts])](#Connect+send)
    * [.onResponse(id, cb)](#Connect+onResponse) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.logout()](#Connect+logout)

# <a name="communication"></a> Messages

All uPort messages once encoded are simply strings. For example a selective disclosure request for a user's ID/address looks as follows:

 ```
 https://id.uport.me/req/eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1Mjc4ODMyMjYsImV4cCI6MTUyNzg4MzgyNiwiY2FsbGJhY2siOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL3dRQkN5MEtpN21NdlJWWTciLCJ0eXBlIjoic2hhcmVSZXEiLCJpc3MiOiJkaWQ6ZXRocjoweGMwNGMwNDY2OWI3MWU2N2NhNWQ5YWE4Zjk5M2YwYTlmNTY5MGE0MjEifQ.th12r7OQqMktVuRhs0AORFdNpndvvnWEjGf6S4_ItiYTT84tTHdqmT23tx1rMQGbkhO8p1auzdXuzLrkqL79gwE
 ```

All requests are defined in the [uport specs](https://github.com/uport-project/uport-js). Each request starts as a JSON object with a number of required and optional key values. This payload then becomes part of a JSON Web Token ([JWT](https://jwt.io)), once it is encoded, and the headers and a signature are added.

The Connect library creates these request messages as part of an entire flow of creating a request and then sending it to a uPort client. If you only want to create a request message, [uport-credentials](https://github.com/uport-project/uport-credentials) can be used. uPort-Credentials primarily handles message creation, signing, encoding, decoding, and verification.

# <a name="communication"></a> Communication and Transports

Once a request message is created, the second primary purpose of uPort Connect is to send it to a uPort client (Mobile App) and then get the repsonse from that client. The library does this by setting up and managing different communication channels depending on the environment in which your app runs and the parameters which you specify. Connect comes with a set of defaults by bundling transports from [uport-transports](https://github.com/uport-project/uport-transports). Transports are communication channels and are simply functions that consume request strings and additional transport params, then they send these strings to a uPort client. Some the tranports will also manage receiving a response to a given request.

 You can take a look at [uport-transports](https://github.com/uport-project/uport-transports) to see all the transports available. If the defaults in Connect are not useful for your use case, you may find using the functions and modules in uport-transports easier and more useful, or you may combine them to create your own transports. By default `uport-connect` offers a setup for sending requests from a desktop web client to a uPort mobile client, and a setup for sending requests from a mobile app to a mobile uPort client on the same device. Additionaly it will send requests in push notification if configured to do so. For all these transports, Connect by default will also handle getting the response.

To support the variety of methods for passing messages between a browser and a uPort client, uPort Connect separates sending requests from handling responses.  Reqeusts are sent via a variety of methods, and each accepts a `requestId` parameter to identify it.  Response handlers are then registered by calling `onResponse` for the same `requestId`, which returns a promise that resolves when the response is available. In particular, this allows for responses to be handled even if the page sending the request is reloaded, or if the response is handled on a different page than the one from which a request is sent.  This is esepecially relevant to mobile browsers, and is discussed more [below](#default-mobile)

## Default QR flow

When the library is loaded on a non-mobile client the library will use QR codes to pass a request from the browser to the uPort mobile application. We provide a default QR-code display function, which injects a `<div>` containing a modal with a QR-code into the DOM. If the request was created on the client side (i.e in Connect) then the response will be relayed through our messaging server Chasqui. In the future you will have the option to run your own messaging server as well. If the request was created on your own server, and you set a URL at your server as the callback, then the response will be returned there. In that case the library will pass the request in a QR code, then you will handle the response as necessary since it will be directly returned to your server.

Example of request created client-side with `uport-connect` which will use the messaging server Chasqui to relay the response.
```javascript
// Displays QR with request, tell uPort client to send response through messaging server
connect.requestDisclosure()

// Polls messaging server for response, resolve promise once response available.
connect.onResponse('disclosureReq').then(payload => {
  const did = payload.res.did
})
```

Example of request where you create the request token on your own server and then send it through connect:

```javascript
// Request created and signed on your server.
const requestToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJ....`
const reqID = 'myRequestID'

// Displays QR with request
connect.request(requestToken, reqId)

connect.onResponse(reqId).then(payload => {
  // Now handle specific to your use case
  // Payload will include payload.id and payload.data but not payload.res, as you will have get what you want from your server.
  // This function simply tells you now it is time to look for any response handling.
})
```

Similarly if are handling the reponse on your server, you may want to pass additional context with the request. For example you may attach a unique id to a request to then later map to a response, you pass this data in the `data` option.

```javascript
// Request created and signed on your server.
const requestToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJ....`
const reqID = 'myRequestID'

// Displays QR with request
connect.request(requestToken, reqId, {data: 'anyRequestContextorID'})

// data option can be useful as this function may be called on another page, or page load of new page
connect.onResponse(reqId).then(payload => {
  const data = payload.data
  const id = payload.id
  // Now handle specific to your use case
})
```

## <a name="default-mobile"></a> Default Mobile Requests

By default `uport-connect` will detect if the library is loaded in a mobile client. When in a mobile client it assumes that the uPort mobile app is on the same device, it will set the window URL to the request URI which will bring up a prompt to open that request URI in the uPort mobile app. If the request was created on the client side (i.e in Connect) then the response will be returned by the mobile app calling a URL which encodes the response and returns control to the calling app. If the request was created on your own server, then by default the response will be returned there, and mobile app will return (redirect) control to the calling app where you can then handle the response as you need for your use case.

Example of request created client-side with `uport-connect`
```javascript
// Opens request URL with will prompt to open uPort mobile client
connect.requestDisclosure()

// When the response returns to the window with this code, this promise will resolve with a response
connect.onResponse('disclosureReq').then(payload => {
  const did = payload.res.did
})
```

Example of request where you create the request token on your own server and then send it through `uport-connect`: Similarly to above you can also pass context between the request and response through the data option.

```javascript
// Request created and signed on your server.
const requestToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJ....`
const reqID = 'myRequestID'

// Opens request URL with will prompt to open uPort mobile client, by default the request tells uPort client to return to this window URL after handling request
connect.request(requestToken, reqId)

// When the response returns to the window with this code, this promise will resolve with a response
connect.onResponse(reqId).then(payload => {
  // Now handle specific to your use case
})
```

Once again create a request token on your server, but tell the uPort mobile client to return to another URL in your application.

```javascript
// Request created and signed on your server.
const requestToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJ....`
const reqID = 'myRequestID'

// Opens request URL witch will prompt user to open uPort mobile client.
connect.request(requestToken, reqId, {redirectUrl: 'http://otherapppage.com/page'})

// Code now in 'http://otherapppage.com/page'
connect.onResponse(reqId).then(payload => {
  // Now handle specific to your use case
})
```

Again create a request token on your server, but tell the uPort mobile client to return the response in the URL rather than POSTing the response to the callback in the request token.

```javascript
// Request created and signed on your server.
const requestToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJ....`
const reqID = 'myRequestID'

// Opens request URL witch will prompt user to open uPort mobile client.
connect.request(requestToken, reqId, {redirectUrl: 'http://myurl.com/handle', type: 'redirect'})

// Code now in 'http://otherapppage.com/page'
connect.onResponse(reqId).then(payload => {
  const response = payload.res
  // The response if available here since you told the mobile uPort client to return it here.
  // If this block of code may be loaded on both desktop and mobile clients you will want a branch of code to handle both
  // i.e. if (payload.res) { //Was returned from mobile } else { //Was on desktop and posted to your server, now handle it }
})
```

## <a name="default-push"></a> Push Notification Requests

As an alternative to QR codes on non-mobile clients, `uport-connect` can send request messages to a uPort client through a push notification. This is simply enabled by requesting push notification permissions from a user through a selective disclosure request. Once a user accepts, a push token will be returned in the response, this push token then allows `uport-connect` to setup a push notification transport or a for a developer to setup their own.

You can request push notification permissions as follows:

```javascript
// Opens this first request in a QR code,
connect.requestDisclosure({ notifications: true })

connect.onResponse('disclosureReq').then(payload => {
  const did = payload.res.did
  // can ignore, as this is saved in the background to connect, and push transport is configured
  // const pushToken = payload.res.pushToken  

  // Now once you make another request, the request will be sent in a push instead of QR code
  // Mobile flow still remains the same
})
```


### Configurations

It you do not want to rely on our default device detection and want to include your own or a different set of rules, then you can simply set the `isMobile` config boolean. This may also be useful if you know your application will always run in a particular environment, for example in a native app.

```js
const uport = new Connect('MyDApp', {
  isMobile: false
})
```

You can pass in your own transport which will be used when on mobile.

```js
const uport = new Connect('MyDApp', {
  mobileTransport: yourMobileTransport
})
```
# <a name="both-default"></a> Combining Both Flows

Since your code may be run on both desktop and mobile clients, we expect the defaults to work for both without you having to writing different code branches for each case. You can pass in mobile transport flow specific params without them affecting the desktop flow. For example the following code can be written and the redirectUrl param will simply be ignored when on a desktop client, while you can handle both responses from each flows in the same way.

```javascript
// Request created and signed on your server.
const requestToken = `eyJ0eXAiOiJKV1QiLCJhbGciOiJ....`
const reqID = 'myRequestID'

// Opens request URL if on mobile client, or open QR code if on a desktop client
connect.request(requestToken, reqId, {redirectUrl: 'http://otherapppage.com/page'})

// Code now in 'http://otherapppage.com/page', for both desktop and mobile clients the response is returend here
connect.onResponse(reqId).then(payload => {
  // Now handle specific to your use case, can be handled the same way for both desktop and mobile clients
})
```

# <a name="ethereum"></a> Ethereum Interactions and Transactions

`uport-connect` offers two Ethereum interaction models. The first is similar to above, where all Ethereum interactions get encoded as uPort requests for a uPort client. You can create these requests in both and `uport-connect` and `uport-credentials` and then send them the same way as the examples above. The second allows you to create a web3 style provider wrapped with uPort functionality.

### <a name="uPortEth"></a> uPort Requests

Get the address of a uPort Id:

```javascript
connect.requestDisclosure()

connect.onResponse('disclosureReq').then(payload => {
  const address = connect.address
  const did = connect.did
})
```

To create a transaction request `contract()` or `sendTransaction()` can be used. `sendTransaction` consumes any valid transaction object, creates a uPort transaction request from it, and uses an appropriate transport (as described in examples above). The response is a transaction hash.

```javascript
const txObj = {
  address: '0x71845bbfe5ddfdb919e780febfff5eda62a30fdc',
  value: 1 * 1.0e18
}
connect.sendTransaction(txObj, 'ethSendReq')
connect.onResponse('ethSendReq').then(payload => {
  const txId = payload.res
})
```

Additionally you can create transaction requests with an interface similar to the familiar contract object in web3 (web3.eth.contract). Once given an ABI and address `connect.contract(abi).at(address)`, you can call the contract functions with this object. Keep in mind thought functionality is limited to function calls which require sending a transaction, as these are the only calls which require interaction with a uPort client. For reading and/or events use web3 along or a similar library along with `uport-connect`.

Using this object over the provider examples below gives you more flexibility and control over the uPort request and response handling flows, where as the provider is more restrictive. It also gives you better access to uPort specific features.

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

  const statusContract = connect.contract(statusContractABI).at("0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087")
  const reqId = 'updateStatus'
  statusContract.updateStatus('hello', reqId)

  connect.onResponse(reqId).then(payload => {
    const txId = payload.res
  })
```

### <a name="web3"></a> Using with a Provider (Web3)

With `uport-connect` you can create a web3 style provider wrapped with uPort functionality and then go and use that with any library which supports these types of providers, for example with web3 or  [ethjs](https://github.com/ethjs/ethjs). If you already have an existing application built on Ethereum using web3 then this may be the simplest uPort integration.

Create a uPort wrapped provider:

```javascript
const connect = new Connect(yourAppName, {network: 'rinkeby'})
const provider = connect.getProvider()
```

Using the provider in web3:

```javascript
const connect = new Connect(yourAppName, {network: 'rinkeby'})
const provider = connect.getProvider()
const web3 = new Web3(provider)
```

After the above setup, you can now use the `web3` object as normal.

The following calls will initiate a uPort request, by default this will show a QR code or use the mobile flow.

* `web3.eth.getCoinbase()` - returns your uport address, if not set already
* `web3.eth.getAccounts()`- returns your uport address in a list, if not set already
* `web3.eth.sendTransaction(txObj)` - returns a transaction hash
* `myContract.myMethod()` - returns a transaction hash

**Limitations**: it's important to note that because the web3 transaction handling is stateful, it requires that uPort requests and responses are handled on the same page.  This means that for some mobile browsers, using a web3 object with a uport subprovider to send transactions may not work properly.  Instead, for full mobile support we recommend using `Connect.sendTransaction`, or creating contracts via `Connect.contract`, and listening for responses from the mobile app with `Connect.onResponse`. _We are actively investigating more elegant solutions to seamless web3 integration.  If you are a developer integrating uport-connect with web3, feel free to open an issue to discuss how to better support your use case._

---------------------------------------------

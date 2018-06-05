---
title: "Connect Library"
index: 2
category: "guides"
type: "content"
source: "https://github.com/uport-project/uport-connect/blob/develop/docs/guides/usage.md"
---

# <a name="usage-guide"></a> Connect Library Guide

The following Connect object is the primary interface you will use. All details and additional documentation can be found in [our docs](https://developer.uport.me/uport-connect/reference/index).

* [Connect]() ⇐ <code>[ConnectCore]()</code>
    * [new Connect(appName, [opts])]()
    * [.getProvider()]() ⇒ <code>[UportSubprovider]()</code>
    * [.requestAddress([id])]()
    * [.request(request, id, [opts])]()
    * [.onResponse(id)]() ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.contract(abi)]() ⇒ <code>Object</code>
    * [.sendTransaction(txobj)]()

# <a name="communication"></a> Requests

 Requests made to a uPort client are just strings which specify uPort and include a request token or JWT. For example an selective disclosure request for a user's ID/address looks as follows once encoded.
 ```
 https://id.uport.me/req/eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE1Mjc4ODMyMjYsImV4cCI6MTUyNzg4MzgyNiwiY2FsbGJhY2siOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL3dRQkN5MEtpN21NdlJWWTciLCJ0eXBlIjoic2hhcmVSZXEiLCJpc3MiOiJkaWQ6ZXRocjoweGMwNGMwNDY2OWI3MWU2N2NhNWQ5YWE4Zjk5M2YwYTlmNTY5MGE0MjEifQ.th12r7OQqMktVuRhs0AORFdNpndvvnWEjGf6S4_ItiYTT84tTHdqmT23tx1rMQGbkhO8p1auzdXuzLrkqL79gwE
 ```

 The Connect library creates some of these requests as part of an entire flow of creating a request and sending it to a uPort client, for example when you call `requestAddress()`, `sendTransaction()`, or `contract()`. You can also create these request messages and others by using [uport-js](https://github.com/uport-project/uport-js) to create the request tokens. Look through [uport-js](https://github.com/uport-project/uport-js) for more details on the requests messages available there. You can also view our [message specs](https://github.com/uport-project/specs) to dig even deeper.

# <a name="communication"></a> Communication and Transports

A primary function of the Connect library is sending request messages to a uPort client, most often the uPort mobile app. It does this by setting up and managing different communication channels depending on the environment in which your app runs and the parameters which you specify. Connect comes with a set of defaults by bundling transports from [uport-core-js](https://github.com/uport-project/uport-core-js). Transports are communication channels and are simply functions that consume request strings (and params), then send these strings to a uPort client. You can take a look at [uport-core-js](https://github.com/uport-project/uport-core-js) to see all the transports available. If the defaults in Connect are not useful for your use case, you may find using the functions and modules in uport-core-js easier and more useful, or you may combine them to create your own transports. By default `uport-connect` offers both a setup for sending requests from a desktop web client to a uPort mobile client, and a setup for sending requests from a mobile app to a mobile uPort client on the same device.

## Default QR flow

When the library is loaded on a non-mobile client the library will use QR codes to pass a request from the browser to the uPort mobile application. We provide a default QR-code display function, which injects a `<div>` containing a modal with a QR-code into the DOM. If the request was created on the client side (i.e in Connect) then the response will be relayed through our messaging server Chasqui. In the future you will have the option to run your own messaging server as well. If the request was created on your own server, then it is assumed you will likely receive the response there. In that case the library will pass the request in a QR code, then you will handle the response as necessary since it will be directly returned to your server.

Example of request created client-side with `uport-connect` which will use the messaging server Chasqui to relay the response.
```javascript
// Displays QR with request, tell uPort client to send response through messaging server
connect.requestAddress()

// Polls messaging server for response, resolve promise once response available.
connect.onResponse('addressReq').then(payload => {
  const id = payload.res.address
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
})
```

## <a name="default-mobile"></a> Default Mobile Requests

By default `uport-connect` will detect if the library is loaded in a mobile client. When in a mobile client it assumes that the uPort mobile app is on the same device, it will set the window URL to the request URI which will bring up a prompt to open that request URI in the uPort mobile app. If the request was created on the client side (i.e in Connect) then the response will be returned by the mobile app calling a URL which encodes the response and returns control to the calling app. If the request was created on your own server, then by default the response will be returned there, and mobile app will return (redirect) control to the calling app where you can then handle the response as you need for your use case.

Example of request created client-side with `uport-connect`
```javascript
// Opens request URL with will prompt to open uPort mobile client
connect.requestAddress()

// When the response returns to the window with this code, this promise will resolve with a response
connect.onResponse('addressReq').then(payload => {
  const id = payload.res.address
})
```

Example of request where you create the request token on your own server and then send it through `uport-connect`:

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
  // The response if available here since you told the mobile uPort client to return it here.
  // If this block of code may be loaded on both desktop and mobile clients you will want a branch of code to handle both
  // i.e. if (payload.res) { //Was returned from mobile } else { //Was on desktop and posted to your server, now handle it }
  const res = payload.res
})
```

### Configurations

It you do not want to rely on our default device detection and want to include your own or a different set of rules, then you can simply set the `isMobile` config boolean. This may also be useful if you know your application will always run on a particular device, for example in a native app.

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

`uport-connect` offers two Ethereum interaction models. The first is similar to above, where all Ethereum interactions get encoded as uPort requests for a uPort client. You can create these requests in both and `uport-connect` and `uport-js` and then send them the same way as the examples above. The second allows you to create a web3 style provider wrapped with uPort functionality.

### <a name="uPortEth"></a> uPort Requests

Get the address of a uPort Id:

```javascript
connect.requestAddress()

connect.onResponse('addressReq').then(payload => {
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

---------------------------------------------

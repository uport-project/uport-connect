---
title: "Uport Connect"
index: 0
category: "reference"
type: "content"
source: "https://github.com/uport-project/uport-connect/blob/develop/docs/reference/index.md"
---



## Classes

<dl>
<dt><a href="#Connect">Connect</a></dt>
<dd></dd>
<dt><a href="#UportSubprovider">UportSubprovider</a></dt>
<dd><p>A web3 style provider which can easily be wrapped with uPort functionality.
 Builds on a base provider. Used in Connect to wrap a provider with uPort specific
 functionality.</p>
</dd>
</dl>

<a name="Connect"></a>

## Connect
**Kind**: global class  

* [Connect](#Connect)
    * [new Connect(appName, [opts])](#new_Connect_new)
    * [.getProvider([provider])](#Connect+getProvider) ⇒ <code>[UportSubprovider](#UportSubprovider)</code>
    * [.onResponse(id, cb)](#Connect+onResponse) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.pubResponse(response)](#Connect+pubResponse)
    * [.send(request, id, [opts])](#Connect+send)
    * [.contract(abi)](#Connect+contract) ⇒ <code>Object</code>
    * [.sendTransaction(txObj, [id])](#Connect+sendTransaction)
    * [.requestVerificationSignature(unsignedClaim, sub, [id])](#Connect+requestVerificationSignature)
    * [.requestDisclosure([reqObj], [id])](#Connect+requestDisclosure)
    * [.sendVerification([verification], [id])](#Connect+sendVerification)
    * [.setState(Update)](#Connect+setState)
    * [.loadState()](#Connect+loadState)
    * [.logout()](#Connect+logout)
    * [.reset()](#Connect+reset)

<a name="new_Connect_new"></a>

### new Connect(appName, [opts])
Instantiates a new uPort Connect object.

**Returns**: <code>[Connect](#Connect)</code> - self  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| appName | <code>String</code> |  | The name of your app |
| [opts] | <code>Object</code> |  | optional parameters |
| [opts.network] | <code>Object</code> | <code>&#x27;rinkeby&#x27;</code> | network config object or string name, ie. { id: '0x1', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten', 'rinkeby'. |
| [opts.accountType] | <code>String</code> |  | Ethereum account type: "general", "segregated", "keypair", or "none" |
| [opts.isMobile] | <code>Boolean</code> |  | Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client |
| [opts.useStore] | <code>Boolean</code> | <code>true</code> | When true, object state will be written to local storage on each state change |
| [opts.store] | <code>Object</code> |  | Storage inteferface with synchronous get() => statObj and set(stateObj) functions, by default store is local storage. For asynchronous storage, set useStore false and handle manually. |
| [opts.usePush] | <code>Boolean</code> | <code>true</code> | Use the pushTransport when a pushToken is available. Set to false to force connect to use standard transport |
| [opts.transport] | <code>function</code> |  | Optional custom transport for desktop, non-push requests |
| [opts.mobileTransport] | <code>function</code> |  | Optional custom transport for mobile requests |
| [opts.muportConfig] | <code>Object</code> |  | Configuration object for muport did resolver. See [muport-did-resolver](https://github.com/uport-project/muport-did-resolver) |
| [opts.ethrConfig] | <code>Object</code> |  | Configuration object for ethr did resolver. See [ethr-did-resolver](https://github.com/uport-project/ethr-did-resolver) |
| [opts.registry] | <code>Object</code> |  | Configuration for uPort DID Resolver (DEPRECATED) See [uport-did-resolver](https://github.com/uport-project/uport-did-resolver) |

**Example**  
```js
import  Connect  from 'uport-connect'
const connect = new Connect('MydappName')
```
<a name="Connect+getProvider"></a>

### connect.getProvider([provider]) ⇒ <code>[UportSubprovider](#UportSubprovider)</code>
Instantiates and returns a web3 styple provider wrapped with uPort functionality.
 For more details see uportSubprovider. uPort overrides eth_coinbase and eth_accounts
 to start a get address flow or to return an already received address. It also
 overrides eth_sendTransaction to start the send transaction flow to pass the
 transaction to the uPort app.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>[UportSubprovider](#UportSubprovider)</code> - A web3 style provider wrapped with uPort functionality  

| Param | Type | Description |
| --- | --- | --- |
| [provider] | <code>Object</code> | An optional web3 style provider to wrap, default is a http provider, non standard provider may cause unexpected behavior, using default is suggested. |

**Example**  
```js
const uportProvider = connect.getProvider()
 const web3 = new Web3(uportProvider)
 
```
<a name="Connect+onResponse"></a>

### connect.onResponse(id, cb) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Get response by id of earlier request, returns promise which resolves when first
 reponse with given id is available. If looking for multiple responses of same id,
 listen instead by passing a callback.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - promise resolves once valid response for given id is avaiable, otherwise rejects with error, no promised returned if callback given  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of request you are waiting for a response for |
| cb | <code>function</code> | an optional callback function, which is called each time a valid repsonse for a given id is available vs having a single promise returned |

<a name="Connect+pubResponse"></a>

### connect.pubResponse(response)
Push a response payload to uPort connect to be handled. Useful if implementing your own transports
and you are getting responses with your own functions, listeners, event handlers etc. It will
parse the response and resolve it to any listening onResponse functions with the matching id. A
response object in connect is of the form {id, payload, data}, where payload and id required. Payload is the
response payload (url or JWT) from a uPort client.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>Object</code> | a wrapped response payload, of form {id, res, data}, res and id required |

<a name="Connect+send"></a>

### connect.send(request, id, [opts])
Send a request message to a uPort client. Useful function if you want to pass additional transport options and/or send a request you already created elsewhere.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>String</code> | a request message to send to a uPort client |
| id | <code>String</code> | id of the request, which you will later use to handle the response |
| [opts] | <code>Object</code> | optional parameters for a callback, see (specs for more details)[https://github.com/uport-project/specs/blob/develop/messages/index.md] |
| opts.redirectUrl | <code>String</code> | If on mobile client, the url you want the uPort client to return control to once it completes it's flow. Depending on the params below, this redirect can include the response or it may be returned to the callback in the request token. |
| opts.data | <code>String</code> | A string of any data you want later returned with the response. It may be contextual to the original request. (i.e. a request id from your server) |
| opts.type | <code>String</code> | Type specifies the callback action. 'post' to send response to callback in request token or 'redirect' to send response in redirect url. |
| opts.cancel | <code>function</code> | When using the default QR send, but handling the response yourself, this function will be called when a user closes the request modal. |

<a name="Connect+contract"></a>

### connect.contract(abi) ⇒ <code>Object</code>
Builds and returns a contract object which can be used to interact with
 a given contract. Similar to web3.eth.contract. Once specifying .at(address)
 you can call the contract functions with this object. It will create a transaction
 sign request and send it. Functionality limited to function calls which require sending
 a transaction, as these are the only calls which require interaction with a uPort client.
 For reading and/or events use web3 alongside or a similar library.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Object</code> - contract object  

| Param | Type | Description |
| --- | --- | --- |
| abi | <code>Object</code> | contract ABI |

<a name="Connect+sendTransaction"></a>

### connect.sendTransaction(txObj, [id])
Given a transaction object (similarly defined as the web3 transaction object)
 it creates a transaction request and sends it. A transaction hash is later
 returned as the response if the user selected to sign it.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txObj | <code>Object</code> |  |  |
| [id] | <code>String</code> | <code>&#x27;txReq&#x27;</code> | string to identify request, later used to get response, name of function call is used by default, if not a function call, the default is 'txReq' |

**Example**  
```js
const txobject = {
   to: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347',
   value: '0.1',
   fn: "setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347')",
   appName: 'MyDapp'
 }
 connect.sendTransaction(txobject, 'setStatus')
 connect.onResponse('setStatus').then(res => {
   const txHash = res.payload
 })

 
```
<a name="Connect+requestVerificationSignature"></a>

### connect.requestVerificationSignature(unsignedClaim, sub, [id])
Request uPort client/user to sign a claim

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| unsignedClaim | <code>Object</code> |  | unsigned claim object which you want the user to attest |
| sub | <code>String</code> |  | the DID which the unsigned claim is about |
| [id] | <code>String</code> | <code>&#x27;signVerReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
const unsignedClaim = {
   claim: {
     "Citizen of city X": {
       "Allowed to vote": true,
       "Document": "QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmPW"
     }
   },
   sub: "did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54"
 }
 connect.requestVerificationSignature(unsignedClaim).then(jwt => {
   ...
 })

 
```
<a name="Connect+requestDisclosure"></a>

### connect.requestDisclosure([reqObj], [id])
Creates a [Selective Disclosure Request JWT](https://github.com/uport-project/specs/blob/develop/messages/sharereq.md)

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [reqObj] | <code>Object</code> | <code>{}</code> | request params object |
| reqObj.requested | <code>Array</code> |  | an array of attributes for which you are requesting credentials to be shared for |
| reqObj.verified | <code>Array</code> |  | an array of attributes for which you are requesting verified credentials to be shared for |
| reqObj.notifications | <code>Boolean</code> |  | boolean if you want to request the ability to send push notifications |
| reqObj.callbackUrl | <code>String</code> |  | the url which you want to receive the response of this request |
| reqObj.networkId | <code>String</code> |  | network id of Ethereum chain of identity eg. 0x4 for rinkeby |
| reqObj.accountType | <code>String</code> |  | Ethereum account type: "general", "segregated", "keypair", or "none" |
| reqObj.expiresIn | <code>Number</code> |  | Seconds until expiry |
| [id] | <code>String</code> | <code>&#x27;disclosureReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
const req = { requested: ['name', 'country'],
               callbackUrl: 'https://myserver.com',
               notifications: true }
 const reqID = 'disclosureReq'
 connect.requestDisclosure(req, reqID)
 connect.onResponse(reqID).then(jwt => {
     ...
 })

 
```
<a name="Connect+sendVerification"></a>

### connect.sendVerification([verification], [id])
Create and send a verification (credential) about connnected user. Verification is signed by
 temporary session keys created by Connect. If you want to create a verification with a different
 keypair/did use uPort credentials and send it with the Connect send function.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [verification] | <code>Object</code> |  | a unsigned verification object, by default the sub is the connected user |
| verification.claim | <code>String</code> |  | a claim about the subject, single key value or key mapping to object with multiple values (ie { address: {street: ..., zip: ..., country: ...}}) |
| verification.exp | <code>String</code> |  | time at which this verification expires and is no longer valid (seconds since epoch) |
| [id] | <code>String</code> | <code>&#x27;sendVerReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
connect.sendVerification({
  exp: <future timestamp>,
  claim: { name: 'John Smith' }
 }, 'REQUEST_ID')
 connect.onResponse('REQUEST_ID').then(credential => {
  ...
 })
```
<a name="Connect+setState"></a>

### connect.setState(Update)
Update the internal state of the connect instance and ensure that it is consistent
with the state saved to localStorage.  You can pass in an object containing key-value pairs to update,
or a function that returns updated key-value pairs as a function of the current state.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Description |
| --- | --- | --- |
| Update | <code>function</code> &#124; <code>Object</code> | - An object, or function specifying updates to the current Connect state (as a function of the current state) |

<a name="Connect+loadState"></a>

### connect.loadState()
Load state from local storage and set this instance's state accordingly.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
<a name="Connect+logout"></a>

### connect.logout()
Clear any user-specific state from the browser, (both the Connect instance and localStorage)
effectively logging them out. The keypair (app-instance identity) is preserved

**Kind**: instance method of <code>[Connect](#Connect)</code>  
<a name="Connect+reset"></a>

### connect.reset()
Clear the entire state of the connect instance, including the keypair, from memory
and localStorage.  Rebuild this.credentials with a new app-instance identity

**Kind**: instance method of <code>[Connect](#Connect)</code>  
<a name="UportSubprovider"></a>

## UportSubprovider
A web3 style provider which can easily be wrapped with uPort functionality.
 Builds on a base provider. Used in Connect to wrap a provider with uPort specific
 functionality.

**Kind**: global class  
<a name="new_UportSubprovider_new"></a>

### new UportSubprovider(args)
Instantiates a new wrapped provider


| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> | required arguments |
| args.requestAddress | <code>function</code> | function to get the address of a uPort identity. |
| args.sendTransaction | <code>function</code> | function to handle passing transaction information to a uPort application |
| args.provider | <code>Object</code> | a web3 sytle provider |


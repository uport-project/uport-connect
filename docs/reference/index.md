---
title: "Uport Connect"
index: 4
category: "reference"
type: "content"
source: "https://github.com/uport-project/uport-connect/blob/develop/docs/reference/index.md"
---



<a name="Connect"></a>

## Connect
**Kind**: global class  

* [Connect](#Connect)
    * [new Connect(appName, [opts])](#new_Connect_new)
    * [.getProvider()](#Connect+getProvider) ⇒ <code>UportSubprovider</code>
    * [.requestAddress([id])](#Connect+requestAddress)
    * [.onResponse(id)](#Connect+onResponse) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.request(uri, id, [opts])](#Connect+request)
    * [.contract(abi)](#Connect+contract) ⇒ <code>Object</code>
    * [.sendTransaction(txObj, [id])](#Connect+sendTransaction)
    * [.createVerificationRequest(reqObj, [id])](#Connect+createVerificationRequest)
    * [.requestDisclosure([params], [id])](#Connect+requestDisclosure) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.attest([credential], [id])](#Connect+attest)
    * [.serialize()](#Connect+serialize) ⇒ <code>String</code>
    * [.deserialize(str)](#Connect+deserialize)
    * [.getState()](#Connect+getState)
    * [.setState()](#Connect+setState)
    * [.setDID()](#Connect+setDID)

<a name="new_Connect_new"></a>

### new Connect(appName, [opts])
Instantiates a new uPort Connect object.

**Returns**: [<code>Connect</code>](#Connect) - self  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| appName | <code>String</code> |  | The name of your app |
| [opts] | <code>Object</code> |  | optional parameters |
| [opts.network] | <code>Object</code> | <code>&#x27;rinkeby&#x27;</code> | network config object or string name, ie. { id: '0x1', registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten', 'rinkeby'. |
| [opts.provider] | <code>Object</code> | <code>HttpProvider</code> | Provider used as a base provider to be wrapped with uPort connect functionality |
| [opts.accountType] | <code>String</code> |  | Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none" |
| [opts.isMobile] | <code>Boolean</code> |  | Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client |
| [opts.storage] | <code>Boolean</code> | <code>true</code> | When true, object state will be written to local storage on each state cz-conventional-change |
| [opts.transport] | <code>function</code> |  | Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client |
| [opts.mobileTransport] | <code>function</code> |  | Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client |
| [opts.muportConfig] | <code>Object</code> |  | Configuration object for muport did resolver. See [muport-did-resolver](https://github.com/uport-project/muport-did-resolver) |
| [opts.ethrConfig] | <code>Object</code> |  | Configuration object for ethr did resolver. See [ethr-did-resolver](https://github.com/uport-project/ethr-did-resolver) |
| [opts.registry] | <code>Object</code> |  | Configuration for uPort DID Resolver (DEPRACATED) See [uport-did-resolver](https://github.com/uport-project/uport-did-resolver) |

**Example**  
```js
import  Connect  from 'uport-connect'
const connect = new Connect('MydappName')
```
<a name="Connect+getProvider"></a>

### connect.getProvider() ⇒ <code>UportSubprovider</code>
Instantiates and returns a web3 styple provider wrapped with uPort functionality.
 For more details see uportSubprovider. uPort overrides eth_coinbase and eth_accounts
 to start a get address flow or to return an already received address. It also
 overrides eth_sendTransaction to start the send transaction flow to pass the
 transaction to the uPort app.

**Kind**: instance method of [<code>Connect</code>](#Connect)  
**Returns**: <code>UportSubprovider</code> - A web3 style provider wrapped with uPort functionality  
**Example**  
```js
const uportProvider = connect.getProvider()
 const web3 = new Web3(uportProvider)

 
```
<a name="Connect+requestAddress"></a>

### connect.requestAddress([id])
Creates a request for only the address/id of the uPort identity.

**Kind**: instance method of [<code>Connect</code>](#Connect)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [id] | <code>String</code> | <code>&#x27;addressReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
connect.requestAddress()

 connect.onResponse('addressReq').then(res => {
   const id = res.res
 })

 
```
<a name="Connect+onResponse"></a>

### connect.onResponse(id) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Get response by id of earlier request, returns promise which resolves when first reponse with given id is available. Listen instead, if looking for multiple responses of same id.

**Kind**: instance method of [<code>Connect</code>](#Connect)  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - promise resolves once valid response for given id is avaiable, otherwise rejects with error  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of request you are waiting for a response for |

<a name="Connect+request"></a>

### connect.request(uri, id, [opts])
Send a request URI string to a uport client.

**Kind**: instance method of [<code>Connect</code>](#Connect)  

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | a request URI to send to a uport client |
| id | <code>String</code> | id of request you are looking for a response for |
| [opts] | <code>Object</code> | optional parameters for a callback, see (specs for more details)[https://github.com/uport-project/specs/blob/develop/messages/index.md] |
| opts.redirectUrl | <code>String</code> | If on mobile client, the url you want to the uPort client to return control to once it completes it's flow. Depending on the params below, this redirect can include the response or it may be returned to the callback in the request token. |
| opts.data | <code>String</code> | A string of any data you want later returned with response. It may be contextual to the original request. |
| opts.type | <code>String</code> | Type specifies the callback action. 'post' to send response to callback in request token or 'redirect' to send response in redirect url. |
| opts.cancel | <code>function</code> | When using the default QR, but handling the response yourself, this function will be called when a users closes the request modal. |

<a name="Connect+contract"></a>

### connect.contract(abi) ⇒ <code>Object</code>
Builds and returns a contract object which can be used to interact with
 a given contract. Similar to web3.eth.contract. Once specifying .at(address)
 you can call the contract functions with this object. It will create a transaction
 sign request and send it. Functionality limited to function calls which require sending
 a transaction, as these are the only calls which require interaction with a uPort client.
 For reading and/or events use web3 alongside or a similar library.

**Kind**: instance method of [<code>Connect</code>](#Connect)  
**Returns**: <code>Object</code> - contract object  

| Param | Type | Description |
| --- | --- | --- |
| abi | <code>Object</code> | contract ABI |

<a name="Connect+sendTransaction"></a>

### connect.sendTransaction(txObj, [id])
Given a transaction object (similarly defined as the web3 transaction object)
 it creates a transaction sign request and sends it.

**Kind**: instance method of [<code>Connect</code>](#Connect)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txObj | <code>Object</code> |  |  |
| [id] | <code>String</code> | <code>&#x27;addressReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
const txobject = {
   to: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347',
   value: '0.1',
   function: "setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347')",
   appName: 'MyDapp'
 }
 connect.sendTransaction(txobject, 'setStatus')
 connect.onResponse('setStatus').then(res => {
   const txId = res.res
 })

 
```
<a name="Connect+createVerificationRequest"></a>

### connect.createVerificationRequest(reqObj, [id])
Request uPort client/user to sign a claim or list of claims

**Kind**: instance method of [<code>Connect</code>](#Connect)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| reqObj | <code>Object</code> |  | object with request params |
| reqObj.unsignedClaim | <code>Object</code> |  | an object that is an unsigned claim which you want the user to attest |
| reqObj.sub | <code>String</code> |  | the DID which the unsigned claim is about |
| [id] | <code>String</code> | <code>&#x27;signClaimReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
const unsignedClaim = {
   claim: {
     "Citizen of city X": {
       "Allowed to vote": true,
       "Document": "QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmPW"
     }
   },
   sub: "2oTvBxSGseWFqhstsEHgmCBi762FbcigK5u"
 }
 credentials.createVerificationRequest(unsignedClaim).then(jwt => {
   ...
 })

 
```
<a name="Connect+requestDisclosure"></a>

### connect.requestDisclosure([params], [id]) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Creates a [Selective Disclosure Request JWT](https://github.com/uport-project/specs/blob/develop/messages/sharereq.md)

**Kind**: instance method of [<code>Connect</code>](#Connect)  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise which resolves with a signed JSON Web Token or rejects with an error  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [params] | <code>Object</code> | <code>{}</code> | request params object |
| params.requested | <code>Array</code> |  | an array of attributes for which you are requesting credentials to be shared for |
| params.verified | <code>Array</code> |  | an array of attributes for which you are requesting verified credentials to be shared for |
| params.notifications | <code>Boolean</code> |  | boolean if you want to request the ability to send push notifications |
| params.callbackUrl | <code>String</code> |  | the url which you want to receive the response of this request |
| params.network_id | <code>String</code> |  | network id of Ethereum chain of identity eg. 0x4 for rinkeby |
| params.accountType | <code>String</code> |  | Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none" |
| params.expiresIn | <code>Number</code> |  | Seconds until expiry |
| [id] | <code>String</code> | <code>&#x27;disclosureReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
const req = { requested: ['name', 'country'],
               callbackUrl: 'https://myserver.com',
               notifications: true }
 credentials.requestDisclosure(req).then(jwt => {
     ...
 })

 
```
<a name="Connect+attest"></a>

### connect.attest([credential], [id])
Create a credential about connnected user

**Kind**: instance method of [<code>Connect</code>](#Connect)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [credential] | <code>Object</code> |  | a unsigned credential object |
| credential.claim | <code>String</code> |  | claim about subject single key value or key mapping to object with multiple values (ie { address: {street: ..., zip: ..., country: ...}}) |
| credential.exp | <code>String</code> |  | time at which this claim expires and is no longer valid (seconds since epoch) |
| [id] | <code>String</code> | <code>&#x27;attestReq&#x27;</code> | string to identify request, later used to get response |

**Example**  
```js
credentials.attest({
  sub: '5A8bRWU3F7j3REx3vkJ...', // uPort address of user, likely a MNID
  exp: <future timestamp>,
  claim: { name: 'John Smith' }
 }).then( credential => {
  ...
 })
```
<a name="Connect+serialize"></a>

### connect.serialize() ⇒ <code>String</code>
Serializes persistant state of Connect object to string. Persistant state includes following
 keys and values; address, mnid, did, doc, firstReq, keypair. You can save this string how you
 like and then restore it's state with the deserialize function.

**Kind**: instance method of [<code>Connect</code>](#Connect)  
**Returns**: <code>String</code> - JSON string  
<a name="Connect+deserialize"></a>

### connect.deserialize(str)
Given string of serialized Connect state, it restores that given state to the Connect
 object which it was called on. You can get the serialized state of a connect object
 by calling the serialize() function.

**Kind**: instance method of [<code>Connect</code>](#Connect)  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> | serialized uPort Connect state |

<a name="Connect+getState"></a>

### connect.getState()
Gets uPort connect state from browser localStorage and sets on this object

**Kind**: instance method of [<code>Connect</code>](#Connect)  
<a name="Connect+setState"></a>

### connect.setState()
Writes serialized uPort connect state to browser localStorage at key 'connectState'

**Kind**: instance method of [<code>Connect</code>](#Connect)  
<a name="Connect+setDID"></a>

### connect.setDID()
Set DID on object, also sets decoded mnid and address

**Kind**: instance method of [<code>Connect</code>](#Connect)  

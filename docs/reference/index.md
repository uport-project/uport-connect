---
title: "Uport Connect"
index: 0
category: "reference"
type: "content"
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
    * [.serialize()](#Connect+serialize) ⇒ <code>String</code>
    * [.deserialize(str)](#Connect+deserialize)
    * [.getState()](#Connect+getState)
    * [.setState()](#Connect+setState)

<a name="new_Connect_new"></a>

### new Connect(appName, [opts])
Instantiates a new uPort Connect object.

**Returns**: <code>[Connect](#Connect)</code> - self  

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

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>UportSubprovider</code> - A web3 style provider wrapped with uPort functionality  
**Example**  
```js
const uportProvider = connect.getProvider()
 const web3 = new Web3(uportProvider)


```
<a name="Connect+requestAddress"></a>

### connect.requestAddress([id])
Creates a request for only the address/id of the uPort identity.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

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

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - promise resolves once valid response for given id is avaiable, otherwise rejects with error  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of request you are waiting for a response for |

<a name="Connect+request"></a>

### connect.request(uri, id, [opts])
Send a request URI string to a uport client.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

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
 a transaction, as these are the only calls which require interaciton with a uPort client.
 For reading and/or events use web3 alongside or a similar library.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Object</code> - contract object  

| Param | Type | Description |
| --- | --- | --- |
| abi | <code>Object</code> | contract ABI |

<a name="Connect+sendTransaction"></a>

### connect.sendTransaction(txObj, [id])
Given a transaction object (similarly defined as the web3 transaction object)
 it creates a transaction sign request and sends it.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

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
<a name="Connect+serialize"></a>

### connect.serialize() ⇒ <code>String</code>
Serializes persistant state of Connect object to string. Persistant state includes following
 keys and values; address, mnid, did, doc, firstReq, keypair. You can save this string how you
 like and then restore it's state with the deserialize function.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>String</code> - JSON string  
<a name="Connect+deserialize"></a>

### connect.deserialize(str)
Given string of serialized Connect state, it restores that given state to the Connect
 object which it was called on. You can get the serialized state of a connect object
 by calling the serialize() function.

**Kind**: instance method of <code>[Connect](#Connect)</code>  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>String</code> | serialized uPort Connect state |

<a name="Connect+getState"></a>

### connect.getState()
Gets uPort connect state from browser localStorage and sets on this object

**Kind**: instance method of <code>[Connect](#Connect)</code>  
<a name="Connect+setState"></a>

### connect.setState()
Writes serialized uPort connect state to browser localStorage at key 'connectState'

**Kind**: instance method of <code>[Connect](#Connect)</code>  

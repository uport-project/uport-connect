---
title: "Uport Connect"
index: 4
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
    * [.request(uri, id, [opts])](#Connect+request) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.contract(abi)](#Connect+contract) ⇒ <code>Object</code>
    * [.sendTransaction(txObj, [id])](#Connect+sendTransaction)

<a name="new_Connect_new"></a>

### new Connect(appName, [opts])
Instantiates a new uPort Connect object.

**Returns**: <code>[Connect](#Connect)</code> - self

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| appName | <code>String</code> |  | the name of your app |
| [opts] | <code>Object</code> |  | optional parameters |
| opts.clientId | <code>String</code> |  | uport identifier for your application this will be used in the default credentials object |
| [opts.network] | <code>Object</code> | <code>&#x27;rinkeby&#x27;</code> | network config object or string name, ie. { id: '0x1', registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten', 'rinkeby'. |
| opts.infuraApiKey | <code>String</code> |  | Infura API Key (register here http://infura.io/register.html) |
| opts.topicFactory | <code>function</code> |  | function which generates topics and deals with requests and response |
| opts.uriHandler | <code>function</code> |  | default function to consume generated URIs for requests, can be used to display QR codes or other custom UX |
| opts.mobileUriHandler | <code>function</code> |  | default function to consume generated URIs for requests on mobile |
| opts.closeUriHandler | <code>function</code> |  | default function called after a request receives a response, can be to close QR codes or other custom UX |
| opts.accountType | <code>String</code> |  | Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none" |
| opts.ethrConfig | <code>Object</code> |  | Configuration object for ethr did resolver. See [ethr-did-resolver](https://github.com/uport-project/ethr-did-resolver) |

**Example**
```js
import { Connect } from 'uport-connect'
const uPort = new ConnectCore('Mydapp')
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
<a name="Connect+requestAddress"></a>

### connect.requestAddress([id])
Creates a request for only the address/id of the uPort identity.

**Kind**: instance method of <code>[Connect](#Connect)</code>

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [id] | <code>String</code> | <code>&#x27;addressReq&#x27;</code> | string to identify request, later used to get response |

<a name="Connect+onResponse"></a>

### connect.onResponse(id) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Get response by id of earlier request, returns promise which resolves when first reponse with given id is avaialable. Listen instead, if looking for multiple responses of same id.

**Kind**: instance method of <code>[Connect](#Connect)</code>
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - promise resolves once valid response for given id is avaiable, otherwise rejects with error

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | id of request you are looking for a response for |

<a name="Connect+request"></a>

### connect.request(uri, id, [opts]) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Send a request URI string to a uport client

**Kind**: instance method of <code>[Connect](#Connect)</code>
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - promise resolves once valid response for given id is avaiable, otherwise rejects with error

| Param | Type | Description |
| --- | --- | --- |
| uri | <code>String</code> | a request URI to send to a uport client |
| id | <code>String</code> | id of request you are looking for a response for |
| [opts] | <code>Object</code> | optional parameters for a callback |
| opts.callback | <code>String</code> | callback TODO ref specs here for cb, data, type and diff between signed and unsigned req |
| opts.data | <code>String</code> |  |
| opts.type | <code>String</code> |  |

<a name="Connect+contract"></a>

### connect.contract(abi) ⇒ <code>Object</code>
Builds and returns a contract object which can be used to interact with
 a given contract. Similar to web3.eth.contract but with promises. Once specifying .at(address)
 you can call the contract functions with this object. It will create a request,
 call the uirHandler with the URI, and return a promise which resolves with
 a transtaction ID.

**Kind**: instance method of <code>[Connect](#Connect)</code>
**Returns**: <code>Object</code> - contract object

| Param | Type | Description |
| --- | --- | --- |
| abi | <code>Object</code> | contract ABI |

<a name="Connect+sendTransaction"></a>

### connect.sendTransaction(txObj, [id])
Given a transaction object, similarly defined as the web3 transaction object,
 it creates a URI which is passes to the uirHandler. It will create request
 and returns a promise which resolves with the transaction id.

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
 connect.sendTransaction(txobject).then(txID => {
   ...
 })


```

## Modules

<dl>
<dt><a href="#module_uport-connect/topicFactory">uport-connect/topicFactory</a></dt>
<dd><p>Manages the communication channel between the uport-connect library and a
 uPort mobile app. The functionality is dependent on the context. If on a
 desktop device the communication channel is through a server. uPort offers a
 server called chasqui to implement this, but you may also run you own server.
 If on a mobile device the communication channel between the broswer and app
 is managed by passing data with URIs/URLs</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#Connect">Connect</a> ⇐ <code><a href="#ConnectCore">ConnectCore</a></code></dt>
<dd><p>Primary object for frontend interactions with uPort. Bundles all neccesary functionality.</p>
</dd>
<dt><a href="#ConnectCore">ConnectCore</a></dt>
<dd><p>Primary object for frontend interactions with uPort. ConnectCore excludes
 some functionality found in Connect for a more customizable and lightweight integration.
 It does not provide any web3 functionality althought you can still use getProvider
 to get a provider to use with web3 or other libraries. It removes all default
 QR injection functionality. Your can choose how you want to handle the UX and/or
 QR generation and use any QR library you choose. For example, if used in a
 mobile native app QR generation is not even necessary.</p>
</dd>
<dt><a href="#UportSubprovider">UportSubprovider</a></dt>
<dd><p>A web3 style provider which can easily be wrapped with uPort functionality.
 Builds on a base provider. Used in Connect to wrap a provider with uPort specific
 functionality.</p>
</dd>
</dl>

<a name="module_uport-connect/topicFactory"></a>

## uport-connect/topicFactory
Manages the communication channel between the uport-connect library and a
 uPort mobile app. The functionality is dependent on the context. If on a
 desktop device the communication channel is through a server. uPort offers a
 server called chasqui to implement this, but you may also run you own server.
 If on a mobile device the communication channel between the broswer and app
 is managed by passing data with URIs/URLs


* [uport-connect/topicFactory](#module_uport-connect/topicFactory)
    * [~TopicFactory(isOnMobile, pollingInterval, chasquiUrl)](#module_uport-connect/topicFactory..TopicFactory) ⇒ <code>function</code>
        * [~waitForHashChange(topicName, cb)](#module_uport-connect/topicFactory..TopicFactory..waitForHashChange)
        * [~pollForResult(topicName, url, cb, cancelled)](#module_uport-connect/topicFactory..TopicFactory..pollForResult)
        * [~clearTopic(url)](#module_uport-connect/topicFactory..TopicFactory..clearTopic)
        * [~newTopic(topicName)](#module_uport-connect/topicFactory..TopicFactory..newTopic) ⇒ <code>Promise.&lt;Object, Error&gt;</code>

<a name="module_uport-connect/topicFactory..TopicFactory"></a>

### uport-connect/topicFactory~TopicFactory(isOnMobile, pollingInterval, chasquiUrl) ⇒ <code>function</code>
Returns a function enclosed with the necessary settings which creates topics
 (or communication channels).

**Kind**: inner method of <code>[uport-connect/topicFactory](#module_uport-connect/topicFactory)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| isOnMobile | <code>Boolean</code> |  | true if in on mobile device, false otherwise |
| pollingInterval | <code>String</code> | <code>2000</code> | the rate at which the messaging server is polled |
| chasquiUrl | <code>String</code> |  | the url of the message server |


* [~TopicFactory(isOnMobile, pollingInterval, chasquiUrl)](#module_uport-connect/topicFactory..TopicFactory) ⇒ <code>function</code>
    * [~waitForHashChange(topicName, cb)](#module_uport-connect/topicFactory..TopicFactory..waitForHashChange)
    * [~pollForResult(topicName, url, cb, cancelled)](#module_uport-connect/topicFactory..TopicFactory..pollForResult)
    * [~clearTopic(url)](#module_uport-connect/topicFactory..TopicFactory..clearTopic)
    * [~newTopic(topicName)](#module_uport-connect/topicFactory..TopicFactory..newTopic) ⇒ <code>Promise.&lt;Object, Error&gt;</code>

<a name="module_uport-connect/topicFactory..TopicFactory..waitForHashChange"></a>

#### TopicFactory~waitForHashChange(topicName, cb)
Waits for a window.onhashchange event, which occurs when control is returned
 from the mobile uPort app to the mobile browser.

**Kind**: inner method of <code>[TopicFactory](#module_uport-connect/topicFactory..TopicFactory)</code>  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>String</code> | the topic you are waiting for a response |
| cb | <code>function</code> | a callback which receives a response or error |

<a name="module_uport-connect/topicFactory..TopicFactory..pollForResult"></a>

#### TopicFactory~pollForResult(topicName, url, cb, cancelled)
Polls a given url (messaging server) for given topic response
 from the mobile uPort app to the mobile browser.

**Kind**: inner method of <code>[TopicFactory](#module_uport-connect/topicFactory..TopicFactory)</code>  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>String</code> | the topic you are waiting for a response |
| url | <code>String</code> | url to poll for a response |
| cb | <code>function</code> | function which is called with a response or error |
| cancelled | <code>function</code> | function which returns true if the polling has been cancelled |

<a name="module_uport-connect/topicFactory..TopicFactory..clearTopic"></a>

#### TopicFactory~clearTopic(url)
Clear a topic on the messaging server, typically used to remove data after a response is received

**Kind**: inner method of <code>[TopicFactory](#module_uport-connect/topicFactory..TopicFactory)</code>  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>String</code> | url endpoint which to clear topic |

<a name="module_uport-connect/topicFactory..TopicFactory..newTopic"></a>

#### TopicFactory~newTopic(topicName) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Creates a topic and random url endpoint on the messaging server. Passes this
 url in requests to the mobile app. Starts polling for a response from the
 mobile app at that url. Returns a promise which resolves a response or rejects
 an error (or timeout).

**Kind**: inner method of <code>[TopicFactory](#module_uport-connect/topicFactory..TopicFactory)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise which resolves with a response or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| topicName | <code>String</code> | the topic you are waiting for a response |

<a name="Connect"></a>

## Connect ⇐ <code>[ConnectCore](#ConnectCore)</code>
Primary object for frontend interactions with uPort. Bundles all neccesary functionality.

**Kind**: global class  
**Extends:** <code>[ConnectCore](#ConnectCore)</code>  

* [Connect](#Connect) ⇐ <code>[ConnectCore](#ConnectCore)</code>
    * [new Connect(appName, [opts])](#new_Connect_new)
    * [.getWeb3()](#Connect+getWeb3) ⇒ <code>web3</code>
    * [.getProvider()](#ConnectCore+getProvider) ⇒ <code>[UportSubprovider](#UportSubprovider)</code>
    * [.requestCredentials([request], [uriHandler])](#ConnectCore+requestCredentials) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.requestAddress([uriHandler])](#ConnectCore+requestAddress) ⇒ <code>Promise.&lt;String, Error&gt;</code>
    * [.attestCredentials(credential, [uriHandler])](#ConnectCore+attestCredentials) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.request(request)](#ConnectCore+request) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.contract(abi)](#ConnectCore+contract) ⇒ <code>Object</code>
    * [.sendTransaction(txobj)](#ConnectCore+sendTransaction) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.addAppParameters(txobj, callbackUrl)](#ConnectCore+addAppParameters) ⇒ <code>Promise.&lt;Object, Error&gt;</code>

<a name="new_Connect_new"></a>

### new Connect(appName, [opts])
Instantiates a new uPort connect object.


| Param | Type | Description |
| --- | --- | --- |
| appName | <code>String</code> | the name of your app |
| [opts] | <code>Object</code> | optional parameters |
| opts.credentials | <code>Object</code> | pre-configured Credentials object from http://github.com/uport-project/uport-js object. Configure this if you need to create signed requests |
| opts.signer | <code>function</code> | signing function which will be used to sign JWT's in the credentials object |
| opts.clientId | <code>String</code> | uport identifier for your application this will be used in the default credentials object |
| [opts.network='kovan'] | <code>Object</code> | network config object or string name, ie. { id: '0x1', registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten'. |
| opts.infuraApiKey | <code>String</code> | Infura API Key (register here http://infura.io/register.html) |
| opts.topicFactory | <code>function</code> | function which generates topics and deals with requests and response |
| opts.uriHandler | <code>function</code> | default function to consume generated URIs for requests, can be used to display QR codes or other custom UX |
| opts.mobileUriHandler | <code>function</code> | default function to consume generated URIs for requests on mobile |
| opts.closeUriHandler | <code>function</code> | default function called after a request receives a response, can be to close QR codes or other custom UX |

**Example**  
```js
import { Connect } from 'uport-connect'
const uPort = new Connect('Mydapp')
```
<a name="Connect+getWeb3"></a>

### connect.getWeb3() ⇒ <code>web3</code>
Instantiates and returns a web3 object wrapped with uPort functionality. For
 more details see uportSubprovider and getProvider in connectCore.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>web3</code> - A uPort web3 object  
<a name="ConnectCore+getProvider"></a>

### connect.getProvider() ⇒ <code>[UportSubprovider](#UportSubprovider)</code>
Instantiates and returns a web3 styple provider wrapped with uPort functionality.
 For more details see uportSubprovider. uPort overrides eth_coinbase and eth_accounts
 to start a get address flow or to return an already received address. It also
 overrides eth_sendTransaction to start the send transaction flow to pass the
 transaction to the uPort app.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>[UportSubprovider](#UportSubprovider)</code> - A web3 style provider wrapped with uPort functionality  
<a name="ConnectCore+requestCredentials"></a>

### connect.requestCredentials([request], [uriHandler]) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Creates a request given a request object, will also always return the user's
 uPort address. Calls given uriHandler with the uri. Returns a promise to
 wait for the response.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise which resolves with a response object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [request] | <code>Object</code> | <code>{}</code> | request object |
| [uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

**Example**  
```js
const req = {requested: ['name', 'country']}
 connect.requestCredentials(req).then(credentials => {
     const address = credentials.address
     const name = credentials.name
     ...
 })

 
```
<a name="ConnectCore+requestAddress"></a>

### connect.requestAddress([uriHandler]) ⇒ <code>Promise.&lt;String, Error&gt;</code>
Creates a request for only the address of the uPort identity. Calls given
 uriHandler with the uri. Returns a promise to wait for the response.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;String, Error&gt;</code> - a promise which resolves with an address or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

<a name="ConnectCore+attestCredentials"></a>

### connect.attestCredentials(credential, [uriHandler]) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Consumes a credential object and generates a signed JWT. Creates a request
 URI with the JWT. Calls given uriHandler with the URI. Returns a promise to wait
 for the response. Throws error if no signer and/or app identifier is set.
 Will not always receive a response, response is only a status.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise which resolves with a resonse object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| credential | <code>Object</code> |  | credential object |
| credential.sub | <code>String</code> |  | subject of this credential |
| credential.claim | <code>Object</code> |  | statement(s) which this credential claims, contructed as {key: 'value', ...} |
| credential.exp | <code>String</code> |  | expiry time of this credential |
| [uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

**Example**  
```js
const cred = {
   sub: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347'
   claim: {'email': 'hello@uport.me'}
   exp: '1300819380'
 }
 connect.attestCredentials(cred).then(res => {
   // response okay, received in uPort app
 })

 
```
<a name="ConnectCore+request"></a>

### connect.request(request) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Create a request and returns a promise which resolves the response. This
 function is primarly is used by more specified functions in this class, which
 allow you to easily create the URIs and messaging server topics you need here.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - promise which resolves with a response object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| request | <code>Object</code> |  | request object |
| request.uri | <code>String</code> |  | uPort URI |
| request.topic | <code>String</code> |  | messaging server topic object |
| [request.uriHandler] | <code>String</code> | <code>this.uriHandler</code> | function to consume URI, can be used to display QR codes or other custom UX |

<a name="ConnectCore+contract"></a>

### connect.contract(abi) ⇒ <code>Object</code>
Builds and returns a contract object which can be used to interact with
 a given contract. Similar to web3.eth.contract but with promises. Once specifying .at(address)
 you can call the contract functions with this object. It will create a request,
 call the uirHandler with the URI, and return a promise which resolves with
 a transtaction ID.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Object</code> - contract object  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| abi | <code>Object</code> |  | contract ABI |
| [request.uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

<a name="ConnectCore+sendTransaction"></a>

### connect.sendTransaction(txobj) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Given a transaction object, similarly defined as the web3 transaction object,
 it creates a URI which is passes to the uirHandler. It will create request
 and returns a promise which resolves with the transaction id.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - A promise which resolves with a resonse object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txobj | <code>Object</code> |  | transaction object, can also be wrapped using addAppParameters |
| [request.uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

**Example**  
```js
const txobject = {
   to: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347',
   value: '0.1',
   function: setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347'),
   appName: 'MyDapp'
 }
 connect.sendTransaction(txobject).then(txID => {
   ...
 })

 
```
<a name="ConnectCore+addAppParameters"></a>

### connect.addAppParameters(txobj, callbackUrl) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Adds application specific data to a transaction object. Then uses this data
 when requests are created.

**Kind**: instance method of <code>[Connect](#Connect)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - A promise which resolves with a resonse object or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| txobj | <code>Object</code> | transaction object |
| callbackUrl | <code>String</code> | application callback url |

<a name="ConnectCore"></a>

## ConnectCore
Primary object for frontend interactions with uPort. ConnectCore excludes
 some functionality found in Connect for a more customizable and lightweight integration.
 It does not provide any web3 functionality althought you can still use getProvider
 to get a provider to use with web3 or other libraries. It removes all default
 QR injection functionality. Your can choose how you want to handle the UX and/or
 QR generation and use any QR library you choose. For example, if used in a
 mobile native app QR generation is not even necessary.

**Kind**: global class  

* [ConnectCore](#ConnectCore)
    * [new ConnectCore(appName, [opts])](#new_ConnectCore_new)
    * [.getProvider()](#ConnectCore+getProvider) ⇒ <code>[UportSubprovider](#UportSubprovider)</code>
    * [.requestCredentials([request], [uriHandler])](#ConnectCore+requestCredentials) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.requestAddress([uriHandler])](#ConnectCore+requestAddress) ⇒ <code>Promise.&lt;String, Error&gt;</code>
    * [.attestCredentials(credential, [uriHandler])](#ConnectCore+attestCredentials) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.request(request)](#ConnectCore+request) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.contract(abi)](#ConnectCore+contract) ⇒ <code>Object</code>
    * [.sendTransaction(txobj)](#ConnectCore+sendTransaction) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
    * [.addAppParameters(txobj, callbackUrl)](#ConnectCore+addAppParameters) ⇒ <code>Promise.&lt;Object, Error&gt;</code>

<a name="new_ConnectCore_new"></a>

### new ConnectCore(appName, [opts])
Instantiates a new uPort connectCore object.


| Param | Type | Description |
| --- | --- | --- |
| appName | <code>String</code> | the name of your app |
| [opts] | <code>Object</code> | optional parameters |
| opts.credentials | <code>Object</code> | pre-configured Credentials object from http://github.com/uport-project/uport-js object. Configure this if you need to create signed requests |
| opts.signer | <code>function</code> | signing function which will be used to sign JWT's in the credentials object |
| opts.clientId | <code>String</code> | uport identifier for your application this will be used in the default credentials object |
| opts.rpcUrl | <code>String</code> | JSON rpc url (defaults to https://ropsten.infura.io) |
| opts.infuraApiKey | <code>String</code> | Infura API Key (register here http://infura.io/register.html) |
| opts.topicFactory | <code>function</code> | function which generates topics and deals with requests and response |
| opts.uriHandler | <code>function</code> | default function to consume generated URIs for requests, can be used to display QR codes or other custom UX |
| opts.mobileUriHandler | <code>function</code> | default function to consume generated URIs for requests on mobile |
| opts.closeUriHandler | <code>function</code> | default function called after a request receives a response, can be to close QR codes or other custom UX |

**Example**  
```js
import { ConnectCore } from 'uport-connect'
const uPort = new ConnectCore('Mydapp')
```
<a name="ConnectCore+getProvider"></a>

### connectCore.getProvider() ⇒ <code>[UportSubprovider](#UportSubprovider)</code>
Instantiates and returns a web3 styple provider wrapped with uPort functionality.
 For more details see uportSubprovider. uPort overrides eth_coinbase and eth_accounts
 to start a get address flow or to return an already received address. It also
 overrides eth_sendTransaction to start the send transaction flow to pass the
 transaction to the uPort app.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>[UportSubprovider](#UportSubprovider)</code> - A web3 style provider wrapped with uPort functionality  
<a name="ConnectCore+requestCredentials"></a>

### connectCore.requestCredentials([request], [uriHandler]) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Creates a request given a request object, will also always return the user's
 uPort address. Calls given uriHandler with the uri. Returns a promise to
 wait for the response.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise which resolves with a response object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [request] | <code>Object</code> | <code>{}</code> | request object |
| [uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

**Example**  
```js
const req = {requested: ['name', 'country']}
 connect.requestCredentials(req).then(credentials => {
     const address = credentials.address
     const name = credentials.name
     ...
 })

 
```
<a name="ConnectCore+requestAddress"></a>

### connectCore.requestAddress([uriHandler]) ⇒ <code>Promise.&lt;String, Error&gt;</code>
Creates a request for only the address of the uPort identity. Calls given
 uriHandler with the uri. Returns a promise to wait for the response.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>Promise.&lt;String, Error&gt;</code> - a promise which resolves with an address or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

<a name="ConnectCore+attestCredentials"></a>

### connectCore.attestCredentials(credential, [uriHandler]) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Consumes a credential object and generates a signed JWT. Creates a request
 URI with the JWT. Calls given uriHandler with the URI. Returns a promise to wait
 for the response. Throws error if no signer and/or app identifier is set.
 Will not always receive a response, response is only a status.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - a promise which resolves with a resonse object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| credential | <code>Object</code> |  | credential object |
| credential.sub | <code>String</code> |  | subject of this credential |
| credential.claim | <code>Object</code> |  | statement(s) which this credential claims, contructed as {key: 'value', ...} |
| credential.exp | <code>String</code> |  | expiry time of this credential |
| [uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

**Example**  
```js
const cred = {
   sub: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347'
   claim: {'email': 'hello@uport.me'}
   exp: '1300819380'
 }
 connect.attestCredentials(cred).then(res => {
   // response okay, received in uPort app
 })

 
```
<a name="ConnectCore+request"></a>

### connectCore.request(request) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Create a request and returns a promise which resolves the response. This
 function is primarly is used by more specified functions in this class, which
 allow you to easily create the URIs and messaging server topics you need here.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - promise which resolves with a response object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| request | <code>Object</code> |  | request object |
| request.uri | <code>String</code> |  | uPort URI |
| request.topic | <code>String</code> |  | messaging server topic object |
| [request.uriHandler] | <code>String</code> | <code>this.uriHandler</code> | function to consume URI, can be used to display QR codes or other custom UX |

<a name="ConnectCore+contract"></a>

### connectCore.contract(abi) ⇒ <code>Object</code>
Builds and returns a contract object which can be used to interact with
 a given contract. Similar to web3.eth.contract but with promises. Once specifying .at(address)
 you can call the contract functions with this object. It will create a request,
 call the uirHandler with the URI, and return a promise which resolves with
 a transtaction ID.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>Object</code> - contract object  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| abi | <code>Object</code> |  | contract ABI |
| [request.uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

<a name="ConnectCore+sendTransaction"></a>

### connectCore.sendTransaction(txobj) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Given a transaction object, similarly defined as the web3 transaction object,
 it creates a URI which is passes to the uirHandler. It will create request
 and returns a promise which resolves with the transaction id.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - A promise which resolves with a resonse object or rejects with an error.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| txobj | <code>Object</code> |  | transaction object, can also be wrapped using addAppParameters |
| [request.uriHandler] | <code>function</code> | <code>this.uriHandler</code> | function to consume uri, can be used to display QR codes or other custom UX |

**Example**  
```js
const txobject = {
   to: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347',
   value: '0.1',
   function: setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347'),
   appName: 'MyDapp'
 }
 connect.sendTransaction(txobject).then(txID => {
   ...
 })

 
```
<a name="ConnectCore+addAppParameters"></a>

### connectCore.addAppParameters(txobj, callbackUrl) ⇒ <code>Promise.&lt;Object, Error&gt;</code>
Adds application specific data to a transaction object. Then uses this data
 when requests are created.

**Kind**: instance method of <code>[ConnectCore](#ConnectCore)</code>  
**Returns**: <code>Promise.&lt;Object, Error&gt;</code> - A promise which resolves with a resonse object or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| txobj | <code>Object</code> | transaction object |
| callbackUrl | <code>String</code> | application callback url |

<a name="UportSubprovider"></a>

## UportSubprovider
A web3 style provider which can easily be wrapped with uPort functionality.
 Builds on a base provider. Used in Connect to wrap a provider with uPort specific
 functionality.

**Kind**: global class  

* [UportSubprovider](#UportSubprovider)
    * [new UportSubprovider(args)](#new_UportSubprovider_new)
    * [.send()](#UportSubprovider+send)
    * [.sendAsync(payload, callback)](#UportSubprovider+sendAsync)

<a name="new_UportSubprovider_new"></a>

### new UportSubprovider(args)
Instantiates a new wrapped provider


| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object</code> | required arguments |
| args.requestAddress | <code>function</code> | function to get the address of a uPort identity. |
| args.sendTransaction | <code>function</code> | function to handle passing transaction information to a uPort application |
| args.provider | <code>Object</code> | a web3 sytle provider |

<a name="UportSubprovider+send"></a>

### uportSubprovider.send()
Synchronous functionality not supported

**Kind**: instance method of <code>[UportSubprovider](#UportSubprovider)</code>  
<a name="UportSubprovider+sendAsync"></a>

### uportSubprovider.sendAsync(payload, callback)
Overrides sendAsync to caputure the following RPC calls eth_coinbase, eth_accounts,
 and eth_sendTransaction. All other calls are passed to the based provider.
 eth_coinbase, eth_accounts will get a uPort identity address with getAddress.
 While eth_sendTransaction with send transactions to a uPort app with sendTransaction

**Kind**: instance method of <code>[UportSubprovider](#UportSubprovider)</code>  

| Param | Type | Description |
| --- | --- | --- |
| payload | <code>Any</code> | request payload |
| callback | <code>function</code> | called with response or error |


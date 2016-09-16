[![uport][uport-image]][uport-url]
[![uport chat][gitter-image]][gitter-url]

<!--npm-->
<!--
  [![NPM version][npm-image]][npm-url]
  [![Downloads][downloads-image]][downloads-url]
  [![NPM][nodei-image]][nodei-url]
-->

<!--build-->
<!--
  [![Build Status][travis-image]][travis-url]
  [![Appveyor Status][appveyor-image]][appveyor-url]
  [![Coverage Status][coveralls-image]][coveralls-url]
-->

<!--dependencies-->
<!--
  [![Dependency Status][david-image]][david-url]
  [![devDependency Status][david-dev-image]][david-dev-url]
  [![peerDependency Status][david-peer-image]][david-peer-url]
-->

# Introduction

**Uport** is a system for self-sovereign digital identity.

This is the client side library that is used to interact with the mobile application where the end-user's keys are stored.

Signing transactions thus requires that the transactions are sent to the phone where they can be signed.
This is accomplished by showing the user a QR-code for each transaction.
The user can then verify the transaction on the phone and send it to the Ethereum network.

In order to make this flow easy for developers, `uport-lib` provides a custom web3 provider which takes care of all of this.

---------------------------------------------

## Using uPort in your dapp

### Getting Started
First we will instantiate the Uport and Web3 objects.
Then we will get the information of the connected user.
Since the information of the connected user is stored on ipfs we need to provide uport-lib with an ipfs provider upon on creation of Uport instance.
Here we use [Infura](https://infura.io/) as an example.

```js
import Web3 from 'web3'
import { Uport } from 'uport-lib'

let web3 = new Web3()
let options = {
  ipfsProvider: {
    host: 'ipfs.infura.io',
    port: '5001',
    protocol: 'https',
    root: ''
  }
}
let uport = new Uport('MyDApp', options)
let rpcUrl = "http://localhost:8545"
let uportProvider = uport.getUportProvider(rpcUrl)

web3.setProvider(uportProvider)

uport.getUserPersona()
     .then((persona) => {
       let profile = persona.getProfile()
       console.log(profile)
     })
```

After the above setup, you can now use the `web3` object as normal.

Also, the following calls will show a QR code for the user to scan:

* `web3.eth.getCoinbase()` - returns your uport address
* `web3.eth.getAccounts()`- returns your uport address in a list
* `web3.eth.sendTransaction(txObj)` - returns a transaction hash
* `myContract.myMethod()` - returns a transaction hash

Check out the examples folder too for how to integrate **uport** in your DApp

---------------------------------------------

### Custom Display of QR codes

`uport-lib` features a default QR-code display function, which injects a `<div>` containing the QR-code into the DOM.
However, you might want to display the QR-code in a different way.

You can provide a `qrDisplay` object with two functions when uport is created.
The `openQr` function is called when the user needs to confirm something on the uport app.
The data argument is a uri that needs to be displayed in a QR-code so that the uport app can scan it.
The `closeQr` function is called when the action has been confirmed in the uport app and the QR-code can be removed from the screen.

```js
let options = {
  ipfsProvider: { ... }
  qrDisplay: {
    openQr(data) { // your code here },
    closeQr() { // your code here }
  }
}
```

The `openQr` function is called each time some information needs to get to the phone.

The `closeQr` is called once the phone has taken an action on the data in the QR-code.

---------------------------------------------

### Interacting with persona objects of other users

You can also import the `Persona` and the `MutablePersona` classes from uport lib to interact with any persona in the `uport-registry`.

```js
import { Persona, MutablePersona } from 'uport-lib'

let userAddress = "0x..."
let ipfsProvider = { ... }
let persona = new Persona(userAddress, ipfsProvider, web3.currentProvider)
persona.load()
       .then((attributes) => {
         console.log(attributes)
       })
```

More information on how to use personas can be found in the [uport-persona](https://github.com/ConsenSys/uport-persona) repo, or by reading the documentation below.

---------------------------------------------

## Contributing
#### Testing / Building (& watching) / Docs

This basic commands can be found in `package.json -> scripts: { }` for contributing to the library.

```
npm run test
npm run build
npm run watch
npm run gen-readme
```

---------------------------------------------

<!-- Badge Variables -->

[uport-image]: https://ipfs.pics/ipfs/QmVHY83dQyym1gDWeMBom7vLJfQ6iGycSWDYZgt2n9Lzah
[uport-url]: https://uport.me
[gitter-image]: https://img.shields.io/badge/gitter-uport--lib-red.svg?style=flat-square
[gitter-url]: https://gitter.im/ConsenSys/uport-lib

<!-- TODO: Add applicable badges
[travis-url]: https://travis-ci.org/webpack/webpack
[travis-image]: https://img.shields.io/travis/webpack/webpack/master.svg
[appveyor-url]: https://ci.appveyor.com/project/sokra/webpack/branch/master
[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/webpack/webpack?svg=true
[coveralls-url]: https://coveralls.io/r/webpack/webpack/
[coveralls-image]: https://img.shields.io/coveralls/webpack/webpack.svg
[npm-url]: https://www.npmjs.com/package/webpack
[npm-image]: https://img.shields.io/npm/v/webpack.svg
[downloads-image]: https://img.shields.io/npm/dm/webpack.svg
[downloads-url]: http://badge.fury.io/js/webpack
[david-url]: https://david-dm.org/webpack/webpack
[david-image]: https://img.shields.io/david/webpack/webpack.svg
[david-dev-url]: https://david-dm.org/webpack/webpack#info=devDependencies
[david-dev-image]: https://david-dm.org/webpack/webpack/dev-status.svg
[david-peer-url]: https://david-dm.org/webpack/webpack#info=peerDependencies
[david-peer-image]: https://david-dm.org/webpack/webpack/peer-status.svg
[nodei-image]: https://nodei.co/npm/webpack.png?downloads=true&downloadRank=true&stars=true
[nodei-url]: https://www.npmjs.com/package/webpack
-->

## Documentation
<a name="Uport"></a>

## Uport
This class is the main entry point for interaction with uport.

**Kind**: global class  

* [Uport](#Uport)
    * [.constructor(dappName, opts)](#Uport.constructor) ⇒ <code>Object</code>
    * [.getUportProvider(rpcUrl)](#Uport.getUportProvider) ⇒ <code>Object</code>
    * [.getUportProvider()](#Uport.getUportProvider) ⇒ <code>Object</code>
    * [.setProviders(web3Provider, ipfsProvider)](#Uport.setProviders)
    * [.getUserPersona()](#Uport.getUserPersona) ⇒ <code>[Promise.&lt;MutablePersona&gt;](#MutablePersona)</code>

<a name="Uport.constructor"></a>

### Uport.constructor(dappName, opts) ⇒ <code>Object</code>
Creates a new uport object.

**Kind**: static method of <code>[Uport](#Uport)</code>  
**Returns**: <code>Object</code> - self  

| Param | Type | Description |
| --- | --- | --- |
| dappName | <code>String</code> | the name of your dapp |
| opts | <code>Object</code> | optional parameters |
| opts.qrDisplay | <code>Object</code> | custom QR-code displaying |
| opts.registryAddress | <code>String</code> | the address of an uport-registry |
| opts.ipfsProvider | <code>Object</code> | an ipfsProvider |
| opts.chasquiUrl | <code>String</code> | a custom chasqui url |

<a name="Uport.getUportProvider"></a>

### Uport.getUportProvider(rpcUrl) ⇒ <code>Object</code>
Get the uport flavored web3 provider. It's implemented using provider engine.

**Kind**: static method of <code>[Uport](#Uport)</code>  
**Returns**: <code>Object</code> - the uport web3 provider  

| Param | Type | Description |
| --- | --- | --- |
| rpcUrl | <code>String</code> | the rpc client to use |

<a name="Uport.getUportProvider"></a>

### Uport.getUportProvider() ⇒ <code>Object</code>
Get the subprovider that handles signing transactions using uport. Use this if you want to customize your provider engine instance.

**Kind**: static method of <code>[Uport](#Uport)</code>  
**Returns**: <code>Object</code> - the uport subprovider  
<a name="Uport.setProviders"></a>

### Uport.setProviders(web3Provider, ipfsProvider)
A method for setting providers if not done previously. This is useful if you are using a custom provider engine for example.
Not that the ipfsProvider can also be set in the constructor.

**Kind**: static method of <code>[Uport](#Uport)</code>  

| Param | Type | Description |
| --- | --- | --- |
| web3Provider | <code>Object</code> | the web3 provider to use (optional) |
| ipfsProvider | <code>Object</code> | the ipfs provider to use (optional) |

<a name="Uport.getUserPersona"></a>

### Uport.getUserPersona() ⇒ <code>[Promise.&lt;MutablePersona&gt;](#MutablePersona)</code>
This method returns an instance of MutablePersona of the current uport user.

**Kind**: static method of <code>[Uport](#Uport)</code>  
**Returns**: <code>[Promise.&lt;MutablePersona&gt;](#MutablePersona)</code> - a MutablePersona instantiated with the address of the connected uport user  

<a name="Persona"></a>

## Persona
Class representing a persona.

**Kind**: global class  

* [Persona](#Persona)
    * [.constructor(address, ipfsProvider, web3Provider, [registryAddress])](#Persona.constructor) ⇒ <code>Object</code>
    * [.loadAttributes()](#Persona.loadAttributes) ⇒ <code>Promise.&lt;JSON, Error&gt;</code>
    * [.load(claims)](#Persona.load) ⇒ <code>Promise.&lt;JSON, Error&gt;</code>
    * [.getProfile()](#Persona.getProfile) ⇒ <code>JSON</code>
    * [.getPublicSigningKey()](#Persona.getPublicSigningKey) ⇒ <code>String</code>
    * [.getPublicEncryptionKey()](#Persona.getPublicEncryptionKey) ⇒ <code>String</code>
    * [.getAllClaims()](#Persona.getAllClaims) ⇒ <code>JSON</code>
    * [.getClaims(attributesName)](#Persona.getClaims) ⇒ <code>JSON</code>
    * [.signAttribute(attribute, privSignKey, issuerId)](#Persona.signAttribute) ⇒ <code>Object</code>
    * [.signMultipleAttributes(attribute, privSignKey, issuerId)](#Persona.signMultipleAttributes) ⇒ <code>Array</code>
    * [.isTokenValid(token)](#Persona.isTokenValid) ⇒ <code>Boolean</code>
    * [.privateKeyToPublicKey(privateKey)](#Persona.privateKeyToPublicKey) ⇒ <code>String</code>

<a name="Persona.constructor"></a>

### Persona.constructor(address, ipfsProvider, web3Provider, [registryAddress]) ⇒ <code>Object</code>
Class constructor.
 Creates a new persona object. The registryAddress is an optional argument and if not specified will be set to the default consensys testnet uport-registry.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>Object</code> - self  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| address | <code>String</code> |  | the address of the persona |
| ipfsProvider | <code>String</code> |  | an ipfs provider |
| web3Provider | <code>String</code> |  | web3 provider |
| [registryAddress] | <code>String</code> | <code>&#x27;0xa9be82e93628abaac5ab557a9b3b02f711c0151c&#x27;</code> | the uport-registry address to use. |

<a name="Persona.loadAttributes"></a>

### Persona.loadAttributes() ⇒ <code>Promise.&lt;JSON, Error&gt;</code>
This should be the only function used to get attributes from the uport-registry. This can be overridden in
 a subclass.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>Promise.&lt;JSON, Error&gt;</code> - A promise that returns all tokens registered to the persona. Encrypted tokens would be included here. Or an Error if rejected.  
<a name="Persona.load"></a>

### Persona.load(claims) ⇒ <code>Promise.&lt;JSON, Error&gt;</code>
This function always have to be called before doing anything else, with the exception of setProfile. This function loads the profile of the persona from the uport-registry into the persona object.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>Promise.&lt;JSON, Error&gt;</code> - A promise that returns all tokens registered to the persona. Encrypted tokens would be included here. Or an Error if rejected.  

| Param | Type | Description |
| --- | --- | --- |
| claims | <code>Object</code> | A list of claims. If argument is not given the persona will load from the registry. |

<a name="Persona.getProfile"></a>

### Persona.getProfile() ⇒ <code>JSON</code>
This function returns the profile of the persona in JSON format.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>JSON</code> - profile  
<a name="Persona.getPublicSigningKey"></a>

### Persona.getPublicSigningKey() ⇒ <code>String</code>
Returns the public signing key of the persona.

**Kind**: static method of <code>[Persona](#Persona)</code>  
<a name="Persona.getPublicEncryptionKey"></a>

### Persona.getPublicEncryptionKey() ⇒ <code>String</code>
Returns the public encryption key of the persona, if set.

**Kind**: static method of <code>[Persona](#Persona)</code>  
<a name="Persona.getAllClaims"></a>

### Persona.getAllClaims() ⇒ <code>JSON</code>
Returns all tokens associated with the persona.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>JSON</code> - List of tokens  
<a name="Persona.getClaims"></a>

### Persona.getClaims(attributesName) ⇒ <code>JSON</code>
Returns all tokens that have the given attribute name.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>JSON</code> - List of tokens  

| Param | Type | Description |
| --- | --- | --- |
| attributesName | <code>String</code> | the name of the attribute to check |

<a name="Persona.signAttribute"></a>

### Persona.signAttribute(attribute, privSignKey, issuerId) ⇒ <code>Object</code>
Signs the given attribute to the persona. This method is to be used by third parties who wishes to attest to an attribute of the persona.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>Object</code> - token  

| Param | Type | Description |
| --- | --- | --- |
| attribute | <code>Object</code> | the attribute to add, in the format {attrName: attr} |
| privSignKey | <code>String</code> | the private signing key of the attestor |
| issuerId | <code>String</code> | the address of the attestor (voluntary, to allow finding info on the attestor from uport-registry) |

<a name="Persona.signMultipleAttributes"></a>

### Persona.signMultipleAttributes(attribute, privSignKey, issuerId) ⇒ <code>Array</code>
Same as addAttribute but for a list of attributes.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>Array</code> - List of tokens  

| Param | Type | Description |
| --- | --- | --- |
| attribute | <code>Array</code> | the attribute to add, in the format [{attrName: attr},...] |
| privSignKey | <code>String</code> | the private signing key of the attestor |
| issuerId | <code>String</code> | the ethereum address of the attestor |

<a name="Persona.isTokenValid"></a>

### Persona.isTokenValid(token) ⇒ <code>Boolean</code>
A static function for checking if a token is valid.

**Kind**: static method of <code>[Persona](#Persona)</code>  

| Param | Type |
| --- | --- |
| token | <code>Object</code> | 

<a name="Persona.privateKeyToPublicKey"></a>

### Persona.privateKeyToPublicKey(privateKey) ⇒ <code>String</code>
A static function for checking if a token is valid.

**Kind**: static method of <code>[Persona](#Persona)</code>  
**Returns**: <code>String</code> - publicKey  

| Param | Type |
| --- | --- |
| privateKey | <code>String</code> | 


<a name="MutablePersona"></a>

## MutablePersona ⇐ <code>[Persona](#Persona)</code>
Class representing a persona that can be modified.

**Kind**: global class  
**Extends:** <code>[Persona](#Persona)</code>  

* [MutablePersona](#MutablePersona) ⇐ <code>[Persona](#Persona)</code>
    * [.constructor(address, ipfsProvider, web3Provider, [registryAddress])](#MutablePersona.constructor) ⇒ <code>Object</code>
    * [.writeToRegistry()](#MutablePersona.writeToRegistry) ⇒ <code>Promise.&lt;String, Error&gt;</code>
    * [.addClaim(token)](#MutablePersona.addClaim)
    * [.addClaims(tokensList)](#MutablePersona.addClaims)
    * [.removeClaim(tokens)](#MutablePersona.removeClaim)
    * [.addAttribute(attribute, privSignKey)](#MutablePersona.addAttribute)
    * [.replaceAttribute(attribute, privSignKey)](#MutablePersona.replaceAttribute)
    * [.removeAttribute(attribute)](#MutablePersona.removeAttribute)
    * [.setPublicSigningKey(privSignKey)](#MutablePersona.setPublicSigningKey)
    * [.setPublicencryptionKey(pubEncKey, privSignKey)](#MutablePersona.setPublicencryptionKey)

<a name="MutablePersona.constructor"></a>

### MutablePersona.constructor(address, ipfsProvider, web3Provider, [registryAddress]) ⇒ <code>Object</code>
Class constructor.
 Creates a new persona object. The registryAddress is an optional argument and if not specified will be set to the default consensys testnet uport-registry.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  
**Returns**: <code>Object</code> - self  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| address | <code>String</code> |  | the address of the persona |
| ipfsProvider | <code>String</code> |  | an ipfs provider |
| web3Provider | <code>String</code> |  | web3 provider |
| [registryAddress] | <code>String</code> | <code>&#x27;0xa9be82e93628abaac5ab557a9b3b02f711c0151c&#x27;</code> | the uport-registry address to use. |

<a name="MutablePersona.writeToRegistry"></a>

### MutablePersona.writeToRegistry() ⇒ <code>Promise.&lt;String, Error&gt;</code>
This should be the only function ever used to write the persona onto the blockchain. This can be overridden in
 a subclass.

 It stores whatever is in this.tokenRecords.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  
**Returns**: <code>Promise.&lt;String, Error&gt;</code> - A promise that returns the txHash of the transaction updating the registry. Or an Error if rejected.  
<a name="MutablePersona.addClaim"></a>

### MutablePersona.addClaim(token)
Add a signed claim to this persona. This should be used to add tokens signed by third parties.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| token | <code>JSON</code> | the claim to add |

<a name="MutablePersona.addClaims"></a>

### MutablePersona.addClaims(tokensList)
Add mulitple signed claims to this persona. This should be used to add tokens signed by third parties.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| tokensList | <code>JSON</code> | the claims to add |

<a name="MutablePersona.removeClaim"></a>

### MutablePersona.removeClaim(tokens)
Removes a signed claim from a persona.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| tokens | <code>JSON</code> | the claims to add |

<a name="MutablePersona.addAttribute"></a>

### MutablePersona.addAttribute(attribute, privSignKey)
Adds a self signed attribute to the persona. Only to be used if you own the pubSignKey of this persona.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| attribute | <code>Object</code> | the attribute to add, in the format {attrName: attr} |
| privSignKey | <code>String</code> | the private signing key of the persona |

<a name="MutablePersona.replaceAttribute"></a>

### MutablePersona.replaceAttribute(attribute, privSignKey)
Removes all tokens having the same attribute name as the given attribute and adds the given attribute.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| attribute | <code>Object</code> | the attribute to add, in the format {attrName: attr} |
| privSignKey | <code>String</code> | the private signing key of the persona |

<a name="MutablePersona.removeAttribute"></a>

### MutablePersona.removeAttribute(attribute)
Removes all attributes with the same attribute name as the given attribute.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| attribute | <code>Object</code> | the attribute to add, in the format {attrName: attr} |

<a name="MutablePersona.setPublicSigningKey"></a>

### MutablePersona.setPublicSigningKey(privSignKey)
Sets the public signing key of the persona.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| privSignKey | <code>String</code> | the private signing key of the persona |

<a name="MutablePersona.setPublicencryptionKey"></a>

### MutablePersona.setPublicencryptionKey(pubEncKey, privSignKey)
Sets the public encryption key of the persona.

**Kind**: static method of <code>[MutablePersona](#MutablePersona)</code>  

| Param | Type | Description |
| --- | --- | --- |
| pubEncKey | <code>String</code> | the public encryption key of the persona |
| privSignKey | <code>String</code> | the private signing key of the persona |



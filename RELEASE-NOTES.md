# Release notes

## Version 1.1.0

### Personal Sign Flow
The uPort mobile app now supports "personal sign" functionality, and there is a new message to make such a request to a uPort mobile app.  For `uport-connect`, support for this feature includes:
* New method `Connect.requestPersonalSign(data, id, sendOpts)` which creates and sends a personal sign request message to a mobile app.  Its response may be listened for with `Connect.onResponse` as all other messages.
* Support for `personal_sign` RPC call (invoked by `web3.personal.sign`, e.g.) in `UportSubprovider`, via the above method on `Connect`

### Typed Data (ERC712) Signature Flow
The uPort mobile app also supports the new `eth_signTypedData` RPC call defined by the [EIP712 Specification](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md).  Correspondingly, this library now includes:
* New method `Connect.requestTypeDataSignature(typedData, id, sendOpts)`, which creates and sends a typed data signature request message to a mobile app. Its response may be listened for with `Connect.onResponse` as all other messages.
* Support for `eth_signTypedData` and `eth_signTypedData_v3` RPC calls in `UportSubprovider`, via the above method on `Connect`

### Simple App Profiles

It's now possible to include a list of JWTs to better identify an application making a request via a new property `vc`.  In particular, a JWT in the form of an "app profile" has semantic meaning to a mobile app, and will be displayed along with the request card. This app profile can contain any subset of the following five fields which are recognized by the uPort Mobile App:

| Key          | Type   | Description |
|--------------|--------|-------------|
|`name`        |`String`| Application name|
|`description` |`String`| Description of application |
|`url`         |`String`| URL from which application is being served|
|`profileImage`|IPLD Link| Foreground image to display in requests to mobile app|
|`bannerImage` |IPLD Link| Background image to display in requests to mobile app |

In particular for `uport-connect`, this message will be set up as follows:
* A `Connect` instance can be instantiated with a `vc` option, which is a list of JWTs or IPFS hashes (in the form `/ipfs/${hash}`), which will be passed along with every request from that instance.
* If no `vc` argument is supplied, the first request from the instance will sign and upload to IPFS a JWT identifying the app's name, the URL from which it has been served, and any other supplied keys of the profile claim described above.  This will become the only entry of the `vc` array, and be passed along with every request.
---------------------------------------------------------------------------------------------------------------
## Version 1.0

With the release of uPort Connect `v1.0.0`, there are a number of changes to our API -- the main differences to watch out for are described in this document, and the full API reference can be found [here](https://developer.uport.me/uport-connect/reference/index).

### `ConnectCore` -> `Connect`
First, on the module level, there is no longer a `ConnectCore` class.  All core functionality is now implemented by the `Connect` object, instantiated as `new Connect(appName, opts)`.  Supplemental "transports" which facilitate communcation with the mobile app have moved to a new repository, [`uport-transports`](https://github.com/uport-project/uport-transports). The transports used in `Connect` are configurable, and you also have the option of providing custom transports in the constructor.  See the `transport`, `pushTransport`, and `mobileTransport` options in the configuration object.

### No public keys in the browser
There was previously confusion about how to keep private keys safe when `Connect` required its own keypair in order to sign messages.  To aleviate this, we no longer require that `Connect` is instantiated with a `privateKey` or `signer`; instead, when a `Connect` is instantiated for the first time on a particular site, it generates a new keypair in the browser to serve as the *instance*'s identity.  This is the identity that will sign requests to a mobile app, and the mobile app user can confirm that subsequent requests come from the same identity.  It is still the case that signing a claim with a particular unique identity (which may belong to your application or company) requires that the keypair for that identity be stored somewhere secure (such as a server), and client

### `localStorage` Persistance
As mentioned above, the keypair that is created on construction of the `Connect` object is saved to localStorage, and is used to re-instantiate the object with the same keypair when the site is reloaded.  Additionally, the `did` and `address` of the most recently authenticated user, and any verified claims they have shared with the application are persisted in localStorage, so that they need not be requested again when a user revisits the page.  Note that this does not share the information with any external service, and is intended to allow applications to maintain something akin to a session without storing a user's information on a server.  For more information about controlling the persistance behavior of `Connect`, see the API [reference](https://developer.uport.me/uport-connect/reference/index)

### New functions `logout`, `reset`
To clear all saved data about a user from the browser, use the `logout()` method.  To additionally destroy the keypair, and so the application's identity, use `reset()`.  Note that following a reset, the user will be prompted to create a new identity in the mobile app upon the next interaction, and will not be able to associate the new browser identity with the old.

### `mnid`, `address`, `did`
With v1.0, we have changed our underlying architecture to use [Decentralized Identifiers](https://w3c-ccg.github.io/did-spec/) (DIDs) as our primary ID.  We retain support for old identities via the `did:uport:` did method, while new accounts are created using the `ethr:did:` did method.  The `did` of the currently authenticated user is readable from a connect instance as `connect.did`.  The `address` field now returns the ethereum address of the currently authenticated user, and the `mnid` field is an encoding of the `address` along with the network id, described further [here](https://github.com/uport-project/mnid).

### `<request>.then()` -> `onResponse(requestId).then()`
In order to address issues that can arise with page reloading when switching between mobile browsers and the uPort app, this release decouples the concepts of *requests* and *responses*.  Where previously a request would return a promise which would resolve when the response was available, now each request requires a `requestId`, which is then used to listen for the response.  This is a much more powerful pattern, that allows for more customized handling of requests and responses potentially on different pages of an app, and the request flow itself is stateless with respect to the browser.

### `requestAddress` -> `requestDisclosure`
The `requestAddress` function has been removed, and `address` and `did` are returned by default for all disclosure requests.  Use `requestDisclosure()` instead.

### `attestCredentials` -> `sendVerification`
Renamed to make names more consistent across our libraries.

### `request` -> `send`
This is the function that sends a pre-signed JWT to the mobile app using the appropriate transport.  It was renamed to clarify it's role as the function that actually invokes the transports.

### `(new Connect(appName, {provider})).getProvider()` -> `connect.getProvider(provider)`
By default, `uport-connect` now uses `ethjs` as our base web3 provider.  To pass a different base provider onto which uport functionality should be applied, pass the provider instance to the `getProvider` instance method, and the returned `UportSubprovider` will wrap the given provider.  **Note:** some providers may not play nicely with the added uport functionality. 

### `connect.getWeb3` removed
To reduce bundle size for those who do not need it, we no longer bundle `web3` with `uport-connect`.  To get a `web3` object configured with uPort functionality, created a new `web3` instance with the `UportSubprovider` returned by `getProvider`, i.e.
```javascript
const web3 = new Web3(connect.getProvider())
```

---------------------------------------------------------------------------------------------------------------

## Version 0.7.0
* Support for encrypted push notifications
* New QR-code modals
* Updated documentation

import { Credentials, ContractFactory } from 'uport-credentials'
import { verifyJWT, decodeJWT } from 'did-jwt'
import MobileDetect from 'mobile-detect'
import { isMNID, encode, decode } from 'mnid'
import { transport, message, network } from 'uport-transports'
import PubSub from 'pubsub-js'
import store from  'store'
import UportLite from 'uport-lite'

import UportSubprovider from './UportSubprovider'

class Connect {
  /**
   * Instantiates a new uPort Connect object.
   *
   * @example
   * import  Connect  from 'uport-connect'
   * const connect = new Connect('MydappName')
   *
   * @param    {String}      appName                      The name of your app
   * @param    {Object}      [opts]                       optional parameters
   * @param    {Object}      [opts.network='rinkeby']     network config object or string name, ie. { id: '0x1', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten', 'rinkeby'.
   * @param    {String}      [opts.accountType]           Ethereum account type: "general", "segregated", "keypair", or "none"
   * @param    {Boolean}     [opts.isMobile]              Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client
   * @param    {Boolean}     [opts.useStore=true]         When true, object state will be written to local storage on each state change
   * @param    {Object}      [opts.store]                 Storage inteferface with synchronous get() => statObj and set(stateObj) functions, by default store is local storage. For asynchronous storage, set useStore false and handle manually.
   * @param    {Boolean}     [opts.usePush=true]          Use the pushTransport when a pushToken is available. Set to false to force connect to use standard transport
   * @param    {Function}    [opts.transport]             Optional custom transport for desktop, non-push requests
   * @param    {Function}    [opts.mobileTransport]       Optional custom transport for mobile requests
   * @param    {Function}    [opts.mobileUriHandler]      Optional uri handler for mobile requests, if using default transports
   * @param    {Object}      [opts.muportConfig]          Configuration object for muport did resolver. See [muport-did-resolver](https://github.com/uport-project/muport-did-resolver)
   * @param    {Object}      [opts.ethrConfig]            Configuration object for ethr did resolver. See [ethr-did-resolver](https://github.com/uport-project/ethr-did-resolver)
   * @param    {Object}      [opts.registry]              Configuration for uPort DID Resolver (DEPRECATED) See [uport-did-resolver](https://github.com/uport-project/uport-did-resolver)
   * @return   {Connect}                                  self
   */
  constructor (appName, opts = {}) {
    // Config
    this.appName = appName || 'uport-connect-app'
    this.network = network.config.network(opts.network)
    this.accountType = opts.accountType === 'none' ? undefined : opts.accountType
    this.isOnMobile = opts.isMobile === undefined ? isMobile() : opts.isMobile
    this.useStore = opts.useStore === undefined ? true : opts.useStore
    this.usePush = opts.usePush === undefined ? true : opts.usePush

    // Disallow segregated account on mainnet
    if (this.network === network.defaults.networks.mainnet && this.accountType === 'segregated') {
      throw new Error('Segregated accounts are not supported on mainnet')
    }

    // Storage
    this.store = opts.store || new LocalStorageStore()

    // Initialize private state
    this._state = {}

    // Load any existing state if any
    if (this.useStore) this.loadState()
    if (!this.keypair.did) this.keypair = Credentials.createIdentity()

    // Transports
    this.PubSub = PubSub
    this.transport = opts.transport || connectTransport(appName)
    this.mobileTransport = opts.mobileTransport || transport.url.send({
      uriHandler: opts.mobileUriHandler,
      messageToURI: (m) => this.useDeeplinks ? message.util.messageToDeeplinkURI(m) : message.util.messageToUniversalURI(m)
    })
    this.onloadResponse = opts.onloadResponse || transport.url.getResponse()
    this.pushTransport = (this.pushToken && this.publicEncKey) ? pushTransport(this.pushToken, this.publicEncKey) : undefined
    transport.url.listenResponse((err, res) => {
      if (err) throw err
      // Switch to deep links after first universal link success
      this.useDeeplinks = true
      this.pubResponse(res)
    })

    // Credential (uport-js) config for verification
    this.registry = opts.registry || UportLite({ networks: network.config.networkToNetworkSet(this.network) })
    this.resolverConfigs = {registry: this.registry, ethrConfig: opts.ethrConfig, muportConfig: opts.muportConfig }
    this.credentials = new Credentials(Object.assign(this.keypair, this.resolverConfigs))     // TODO can resolver configs not be passed through
  }

 /**
  *  Instantiates and returns a web3 styple provider wrapped with uPort functionality.
  *  For more details see uportSubprovider. uPort overrides eth_coinbase and eth_accounts
  *  to start a get address flow or to return an already received address. It also
  *  overrides eth_sendTransaction to start the send transaction flow to pass the
  *  transaction to the uPort app.
  *
  *  @example
  *  const uportProvider = connect.getProvider()
  *  const web3 = new Web3(uportProvider)
  *
  *  @param      {Object}           [provider]    An optional web3 style provider to wrap, default is a http provider, non standard provider may cause unexpected behavior, using default is suggested.
  *  @return     {UportSubprovider}               A web3 style provider wrapped with uPort functionality
  */
  getProvider (provider) {
    const subProvider = new UportSubprovider({
      requestAddress: () => {
        const requestID = 'addressReqProvider'
        this.requestDisclosure({accountType: this.accountType || 'keypair'}, requestID)
        return this.onResponse(requestID).then(res => res.payload.address)
      },
      sendTransaction: (txObj) => {
        delete txObj['from']
        const requestID = 'txReqProvider'
        this.sendTransaction(txObj, requestID)
        return this.onResponse(requestID).then(res => res.payload)
      },
      provider, network: this.network
    })
    if (this.address) subProvider.setAccount(this.address)
    return subProvider
  }

  /**
   *  Get response by id of earlier request, returns promise which resolves when first
   *  reponse with given id is available. If looking for multiple responses of same id,
   *  listen instead by passing a callback.
   *
   *  @param    {String}       id          id of request you are waiting for a response for
   *  @param    {Function}     cb          an optional callback function, which is called each time a valid repsonse for a given id is available vs having a single promise returned
   *  @return   {Promise<Object, Error>}   promise resolves once valid response for given id is avaiable, otherwise rejects with error, no promised returned if callback given
   */
  onResponse(id, cb) {
    const parseResponse = (res) => {
      if (res.error) return Promise.reject(Object.assign({id}, res))
      if (message.util.isJWT(res.payload)) {
        const jwt = res.payload
        const decoded = decodeJWT(jwt)
        if (decoded.payload.claim){
          return Promise.resolve(Object.assign({id}, res))
        }
        return this.verifyResponse(jwt).then(parsedRes => {
          // Set identifiers present in the response
          // TODO maybe just change name in uport-js
          if (parsedRes.boxPub) parsedRes.publicEncKey = parsedRes.boxPub
          this.setState(parsedRes)
          return {id, payload: parsedRes, data: res.data}
        })
      } else {
        return Promise.resolve(Object.assign({id}, res))
      }
    }

    if (this.onloadResponse && this.onloadResponse.id === id) {
      const onloadResponse = this.onloadResponse
      this.onloadResponse = null
      return parseResponse(onloadResponse)
    }

    if (cb) {
      this.PubSub.subscribe(id, (msg, res) => {
        parseResponse(res).then(
          (res) => { cb(null, res) },
          (err) => { cb(err, null) }
        )
      })
    } else {
      return new Promise((resolve, reject) => {
        this.PubSub.subscribe(id, (msg, res) => {
          this.PubSub.unsubscribe(id)
          parseResponse(res).then(resolve, reject)
        })
      })
    }
  }

  /**
   * Push a response payload to uPort connect to be handled. Useful if implementing your own transports
   * and you are getting responses with your own functions, listeners, event handlers etc. It will
   * parse the response and resolve it to any listening onResponse functions with the matching id. A
   * response object in connect is of the form {id, payload, data}, where payload and id required. Payload is the
   * response payload (url or JWT) from a uPort client.
   *
   * @param {Object} response  a wrapped response payload, of form {id, res, data}, res and id required
   */
  pubResponse (response) {
    if (!response || !response.id) throw new Error('Response payload requires an id')
    this.PubSub.publish(response.id, {payload: response.payload, data: response.data})
  }

  /**
   * @private
   * Verify a jwt and save the resulting doc to this instance, then process the
   * disclosure payload with this.credentials
   * @param {JWT} token   the JWT to be verified
   */
  verifyResponse (token) {
    return verifyJWT(token, {audience: this.credentials.did}).then(res => {
      this.doc = res.doc
      return this.credentials.processDisclosurePayload(res)
    })
  }

 /**
  *  Send a request message to a uPort client. Useful function if you want to pass additional transport options and/or send a request you already created elsewhere.
  *
  *  @param    {String}     request           a request message to send to a uPort client
  *  @param    {String}     id                id of the request, which you will later use to handle the response
  *  @param    {Object}     [opts]            optional parameters for a callback, see (specs for more details)[https://github.com/uport-project/specs/blob/develop/messages/index.md]
  *  @param    {String}     opts.redirectUrl  If on mobile client, the url you want the uPort client to return control to once it completes it's flow. Depending on the params below, this redirect can include the response or it may be returned to the callback in the request token.
  *  @param    {String}     opts.data         A string of any data you want later returned with the response. It may be contextual to the original request. (i.e. a request id from your server)
  *  @param    {String}     opts.type         Type specifies the callback action. 'post' to send response to callback in request token or 'redirect' to send response in redirect url.
  *  @param    {Function}   opts.cancel       When using the default QR send, but handling the response yourself, this function will be called when a user closes the request modal.
  */
  send (request, id, {redirectUrl, data, type, cancel} = {}) {
    if (!id) throw new Error('Requires request id')
    if (this.isOnMobile) {
      if (!redirectUrl & !type) type = 'redirect'
      this.mobileTransport(request, {id, data, redirectUrl, type})
    } else if (this.usePush && this.pushTransport) {
      this.pushTransport(request, {data}).then(res => this.PubSub.publish(id, res))
    } else {
      this.transport(request, {data, cancel}).then(res => this.PubSub.publish(id, res))
    }
  }

 /**
  *  Builds and returns a contract object which can be used to interact with
  *  a given contract. Similar to web3.eth.contract. Once specifying .at(address)
  *  you can call the contract functions with this object. It will create a transaction
  *  sign request and send it. Functionality limited to function calls which require sending
  *  a transaction, as these are the only calls which require interaction with a uPort client.
  *  For reading and/or events use web3 alongside or a similar library.
  *
  * @example
  * const abi = [{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]
  * const StatusContract = connect.contract(abi).at('0x70A804cCE17149deB6030039798701a38667ca3B')
  * const reqId = 'updateStatus'
  * StatusContract.updateStatus('helloStatus', reqId)
  *  connect.onResponse('reqId').then(res => {
  *    const txHash = res.payload
  *  })
  *
  *  @param    {Object}       abi      contract ABI
  *  @return   {Object}                contract object
  */
  contract (abi) {
    const txObjHandler = (txObj, id, sendOpts) => {
      txObj.fn = txObj.function
      delete txObj['function']
      return this.sendTransaction(txObj, id, sendOpts)
    }
    return ContractFactory(txObjHandler.bind(this))(abi)
  }

  /**
   *  Given a transaction object (similarly defined as the web3 transaction object)
   *  it creates a transaction request and sends it. A transaction hash is later
   *  returned as the response if the user selected to sign it.
   *
   *  @example
   *  const txobject = {
   *    to: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347',
   *    value: '0.1',
   *    fn: "setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347')",
   *    appName: 'MyDapp'
   *  }
   *  connect.sendTransaction(txobject, 'setStatus')
   *  connect.onResponse('setStatus').then(res => {
   *    const txHash = res.payload
   *  })
   *
   *  @param    {Object}    txObj
   *  @param    {String}    [id='txReq']    string to identify request, later used to get response, name of function call is used by default, if not a function call, the default is 'txReq'
   *  @param    {Object}    [sendOpts]      reference send function options
   */
   sendTransaction (txObj, id, sendOpts) {
     txObj.to = isMNID(txObj.to) ? txObj.to : encode({network: this.network.id, address: txObj.to})
     //  Create default id, where id is function name, or txReq if no function name
     if (!id) id = txObj.fn ? txObj.fn.split('(')[0] : 'txReq'
     this.credentials.createTxRequest(txObj, {callbackUrl: this.genCallback(id)})
                     .then(jwt => this.send(jwt, id, sendOpts))
   }

  /**
   *  Creates a request for a user to [sign a verification](https://github.com/uport-project/specs/blob/develop/messages/verificationreq.md) and sends the request to the uPort user.
   *
   *  @example
   *  const unsignedClaim = {
   *    claim: {
   *      "Citizen of city X": {
   *        "Allowed to vote": true,
   *        "Document": "QmZZBBKPS2NWc6PMZbUk9zUHCo1SHKzQPPX4ndfwaYzmPW"
   *      }
   *    },
   *    sub: "did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54"
   *  }
   *  connect.requestVerificationSignature(unsignedClaim).then(jwt => {
   *    ...
   *  })
   *
   *  @param    {Object}     unsignedClaim          unsigned claim object which you want the user to attest
   *  @param    {String}     sub                    the DID which the unsigned claim is about
   *  @param    {String}     [id='signVerReq']      string to identify request, later used to get response
   *  @param    {Object}     [sendOpts]             reference send function options
   */
  requestVerificationSignature (unsignedClaim, sub, id = 'verSigReq', sendOpts) {
    this.credentials.createVerificationSignatureRequest(unsignedClaim, {sub, aud: this.did, callbackUrl: this.genCallback(id)})
      .then(jwt => this.send(jwt, id, sendOpts))
  }

  /**
   *  Creates a [Selective Disclosure Request JWT](https://github.com/uport-project/specs/blob/develop/messages/sharereq.md) and sends request message to uPort client.
   *
   *  @example
   *  const req = { requested: ['name', 'country'],
   *                callbackUrl: 'https://myserver.com',
   *                notifications: true }
   *  const reqID = 'disclosureReq'
   *  connect.requestDisclosure(req, reqID)
   *  connect.onResponse(reqID).then(jwt => {
   *      ...
   *  })
   *
   *  @param    {Object}     [reqObj={}]           request params object
   *  @param    {Array}      reqObj.requested      an array of attributes for which you are requesting credentials to be shared for
   *  @param    {Array}      reqObj.verified       an array of attributes for which you are requesting verified credentials to be shared for
   *  @param    {Boolean}    reqObj.notifications  boolean if you want to request the ability to send push notifications
   *  @param    {String}     reqObj.callbackUrl    the url which you want to receive the response of this request
   *  @param    {String}     reqObj.networkId      network id of Ethereum chain of identity eg. 0x4 for rinkeby
   *  @param    {String}     reqObj.accountType    Ethereum account type: "general", "segregated", "keypair", or "none"
   *  @param    {Number}     reqObj.expiresIn      Seconds until expiry
   *  @param    {String}     [id='disclosureReq']  string to identify request, later used to get response
   *  @param    {Object}     [sendOpts]            reference send function options
   */
  requestDisclosure (reqObj, id = 'disclosureReq', sendOpts) {
    reqObj = Object.assign({
      accountType: this.accountType || 'none',
      callbackUrl: this.genCallback(id)
    }, reqObj)
    this.credentials.createDisclosureRequest(reqObj, reqObj.expiresIn)
      .then(jwt => this.send(jwt, id, sendOpts))
  }

  /**
   *  Create and send a verification (credential) about connnected user. Verification is signed by
   *  temporary session keys created by Connect. If you want to create a verification with a different
   *  keypair/did use uPort credentials and send it with the Connect send function.
   *
   *  @example
   *  connect.sendVerification({
   *   exp: <future timestamp>,
   *   claim: { name: 'John Smith' }
   *  }, 'REQUEST_ID')
   *  connect.onResponse('REQUEST_ID').then(credential => {
   *   ...
   *  })
   *
   * @param    {Object}     [verification]        a unsigned verification object, by default the sub is the connected user
   * @param    {Object}     verification.claim    a claim about the subject, single key value or key mapping to object with multiple values (ie { address: {street: ..., zip: ..., country: ...}})
   * @param    {String}     verification.exp      time at which this verification expires and is no longer valid (seconds since epoch)
   * @param    {String}     [id='sendVerReq']     string to identify request, later used to get response
   * @param    {Object}     [sendOpts]            reference send function options
   */
  sendVerification (verification, id = 'sendVerReq', sendOpts) {
    // Callback and message form differ for this req, may be reconciled in the future
    const cb = this.genCallback(id)
    if (!verification.sub) verification.sub = this.did
    this.credentials.createVerification(verification).then(jwt => {
      const uri = message.util.paramsToQueryString(message.util.messageToURI(jwt), {'callback_url': cb})
      this.send(uri, id, sendOpts)
    })
  }

  /**
   * Update the internal state of the connect instance and ensure that it is consistent
   * with the state saved to localStorage.  You can pass in an object containing key-value pairs to update,
   * or a function that returns updated key-value pairs as a function of the current state.
   *
   * @param {Function|Object} Update -- An object, or function specifying updates to the current Connect state (as a function of the current state)
   */

  setState(update) {
    switch (typeof update) {
      case 'object':
        this._state = { ...this._state, ...update }
        break
      case 'function':
        this._state = update(this._state)
        break
      case 'undefined':
        break
      default:
        throw new Error(`Cannot update state with ${update}`)
    }
    // Normalize address to mnid
    const { mnid } = this._state
    if (isMNID(mnid)) {
      this._state.address = decode(mnid).address
    } else if (mnid) {
      // Don't allow setting an invalid mnid
      throw new Error(`Invalid MNID: ${this._state.mnid}`)
    }

    if (this.publicEncKey && this.pushToken) {
      this.pushTransport = pushTransport(this.pushToken, this.publicEncKey)
    }

    // Write to localStorage
    if (this.useStore) this.store.set(this._state)
  }

  /**
   * Load state from local storage and set this instance's state accordingly.
   */
  loadState() {
    // replace state
    if (this.useStore) this.setState(state => this.store.get())
  }

  /**
   * Clear any user-specific state from the browser, (both the Connect instance and localStorage)
   * effectively logging them out. The keypair (app-instance identity) is preserved
   */
  logout() {
    // Clear explicit state
    this.setState(state => ({keypair: state.keypair}))
    // Clear all instance variables with references to current state
    this.pushTransport = null
  }

  /**
   * Clear the entire state of the connect instance, including the keypair, from memory
   * and localStorage.  Rebuild this.credentials with a new app-instance identity
   */
  reset() {
    this.logout()
    // Rebuild credentials
    this.keypair = Credentials.createIdentity()
    this.credentials = new Credentials({...this.keypair, ...this.resolverConfigs})
  }

  /**
   * Accessor methods for Connect state.  The state consists of the key-value pairs below
   *  (did, doc, mnid, address, keypair, pushToken, and publicEncKey)
   * @private
   */
  get state ()        { return this._state }
  get did ()          { return this._state.did }
  get doc ()          { return {...this._state.doc} }
  get mnid ()         { return this._state.mnid }
  get address ()      { return this._state.address }
  get keypair ()      { return {...this._state.keypair} }
  get verified ()     { return this._state.verified }
  get pushToken ()    { return this._state.pushToken }
  get publicEncKey () { return this._state.publicEncKey }

  /**
   * Setter methods with appropriate validation
   * @private
   */

  set state (state)               { throw new Error('Use setState to set state object') }
  set did (did)                   { this.setState({did}) }
  set doc (doc)                   { this.setState({doc}) }
  set mnid (mnid)                 { this.setState({mnid}) }
  set keypair (keypair)           { this.setState({keypair}) }
  set verified (verified)         { this.setState({verified}) }
  set pushToken (pushToken)       { this.setState({pushToken}) }
  set publicEncKey (publicEncKey) { this.setState({publicEncKey}) }

  // Address field alone is deprectated.  Allow setting an mnid, but not an unqualified address
  set address (address) {
    if (isMNID(address)) {
      this.setState({mnid: address})
    } else {
      if (address === this.address) return
      throw new Error('Setting an Ethereum address without a network id is not supported.  Use an MNID instead.')
    }
  }

  /**
   *  @private
   */
  genCallback(reqId) {
    return this.isOnMobile ?  windowCallback(reqId) : transport.messageServer.genCallback()
  }
}

const LOCALSTOREKEY = 'connectState'

class LocalStorageStore {
  constructor (key = LOCALSTOREKEY) {
    this.key = key
  }

  get() {
    return JSON.parse(store.get(this.key) || '{}')
  }

  set(stateObj) {
    store.set(this.key, JSON.stringify(stateObj))
  }
}

/**
 *  A transport created for uPort connect. Bundles transport functionality from uport-transports. This implements the
 *  default QR modal flow on desktop clients. If given a request which uses the messaging server Chasqui to relay
 *  responses, it will by default poll Chasqui and return response. If given a request which specifies another
 *  callback to receive the response, for example your own server, it will show the request in the default QR
 *  modal and then instantly return. You can then handle how to fetch the response specific to your implementation.
 *
 *  @param    {String}       appName                 App name displayed in QR pop over modal
 *  @return   {Function}                             Configured connectTransport function
 *  @param    {String}       request                 uPort client request message
 *  @param    {Object}       [config={}]             Optional config object
 *  @param    {String}       config.data             Additional data to be returned later with response
 *  @return   {Promise<Object, Error>}               Function to close the QR modal
 *  @private
 */
const connectTransport = (appName) => (request, {data, cancel}) => {
  if (transport.messageServer.isMessageServerCallback(request)) {
    return  transport.qr.chasquiSend({appName})(request).then(res => ({payload: res, data}))
  } else {
    transport.qr.send(appName)(request, {cancel})
    // TODO return close QR func?
    return Promise.resolve({data})
  }
}

/**
 * Wrap push transport from uport-transports, providing stored pushToken and publicEncKey from the
 * provided Connect instance
 * @param   {Connect} connect   The Connect instance holding the pushToken and publicEncKey
 * @returns {Function}          Configured pushTransport function
 * @private
 */
const pushTransport = (pushToken, publicEncKey) => {
  const send = transport.push.sendAndNotify(pushToken, publicEncKey)

  return (request, { type, redirectUrl, data}) => {
    if (transport.messageServer.isMessageServerCallback(request)) {
      return transport.messageServer.URIHandlerSend(send)(request, {type, redirectUrl})
        .then(res => {
          transport.ui.close()
          return {payload: res, data}
        })
    } else {
      // Return immediately for custom message server
      send(request, {type, redirectUrl})
      return Promise.resolve({data})
    }
  }
}

/**
 *  Gets current window url and formats as request callback
 *
 *  @return   {String}   Returns window url formatted as callback
 *  @private
 */
const windowCallback = (id) => {
  const md = new MobileDetect(navigator.userAgent)
  const chromeAndIOS = (md.userAgent() === 'Chrome' && md.os() === 'iOS')
  const callback = chromeAndIOS ? `googlechrome:${window.location.href.substring(window.location.protocol.length)}` : window.location.href
  return message.util.paramsToUrlFragment(callback, {id})
}

/**
 *  Detects if this library is called on a mobile device or tablet.
 *
 *  @param    {Object}     params    A object of params known to uPort
 *  @return   {Boolean}              Returns true if on mobile or tablet, false otherwise.
 *  @private
 */
const isMobile = () => {
  if (typeof navigator !== 'undefined') {
    return !!(new MobileDetect(navigator.userAgent).mobile())
  } else return false
}

export default Connect

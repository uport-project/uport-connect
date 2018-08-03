import { Credentials, ContractFactory } from 'uport'
import { verifyJWT, decodeJWT } from 'did-jwt'
import MobileDetect from 'mobile-detect'
import HttpProvider from 'web3/lib/web3/httpprovider' // Can use http provider from ethjs in the future.
import { isMNID, encode, decode } from 'mnid'
import { transport, message, network, provider } from 'uport-transports'
import PubSub from 'pubsub-js'
import store from  'store'
import UportLite from 'uport-lite'

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
   * @param    {Object}      [opts.network='rinkeby']     network config object or string name, ie. { id: '0x1', registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten', 'rinkeby'.
   * @param    {Object}      [opts.provider=HttpProvider] Provider used as a base provider to be wrapped with uPort connect functionality
   * @param    {String}      [opts.accountType]           Ethereum account type: "general", "segregated", "keypair", or "none"
   * @param    {Boolean}     [opts.isMobile]              Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client
   * @param    {Boolean}     [opts.storage=true]          When true, object state will be written to local storage on each state cz-conventional-change
   * @param    {Boolean}     [opts.usePush=true]          Use the pushTransport when a pushToken is available. Set to false to force connect to use standard transport
   * @param    {Function}    [opts.transport]             Optional custom transport for desktop, non-push requests
   * @param    {Function}    [opts.mobileTransport]       Optional custom transport for mobile requests
   * @param    {Object}      [opts.muportConfig]          Configuration object for muport did resolver. See [muport-did-resolver](https://github.com/uport-project/muport-did-resolver)
   * @param    {Object}      [opts.ethrConfig]            Configuration object for ethr did resolver. See [ethr-did-resolver](https://github.com/uport-project/ethr-did-resolver)
   * @param    {Object}      [opts.registry]              Configuration for uPort DID Resolver (DEPRACATED) See [uport-did-resolver](https://github.com/uport-project/uport-did-resolver)
   * @return   {Connect}                                  self
   */
  constructor (appName, opts = {}) {
    // Config
    this.appName = appName || 'uport-connect-app'
    this.network = network.config.network(opts.network)
    this.provider = opts.provider || new HttpProvider(this.network.rpcUrl)
    this.accountType = opts.accountType === 'none' ? undefined : opts.accountType
    this.isOnMobile = opts.isMobile === undefined ? isMobile() : opts.isMobile
    this.storage = opts.storage === undefined ? true : opts.storage
    this.usePush = opts.usePush === undefined ? true : opts.usePush

    // Disallow segregated account on mainnet
    if (this.network === network.defaults.networks.mainnet && this.accountType === 'segregated') {
      throw new Error('Segregated accounts are not supported on mainnet')
    }

    // Initialize private state
    this._state = {
      did: null,
      mnid: null,
      address: null,
      doc: null,
      pushToken: null,
      publicEncKey: null
    }

    // Load any existing state if any
    if (this.storage) this.getState()
    if (!this.keypair || !this.keypair.did) this.keypair = Credentials.createIdentity()
    if (this.storage) this.setState()

    // Transports
    this.PubSub = PubSub
    this.transport = opts.transport || connectTransport(appName)
    this.mobileTransport = opts.mobileTransport || transport.url.send()
    this.onloadResponse = opts.onloadResponse || transport.url.getResponse()
    this.pushTransport = (this.pushToken && this.publicEncKey) ? pushTransport(this.pushToken, this.publicEncKey) : undefined
    transport.url.listenResponse((err, payload) => {
      if (err) throw err
      this.pubResponse(payload)
    })

    // State
    this.did = null
    this.mnid = null
    this.address = null
    this.doc = null
    this.pushToken = null
    this.publicEncKey = null

    // Load any existing state if any
    if (this.storage) this.getState()
    if (!this.keypair) this.keypair = Credentials.createIdentity()
    if (this.storage) this.setState()

    // Credential (uport-js) config for verification
    this.registry = opts.registry || UportLite({ networks: network.config.networkToNetworkSet(this.network) })
    this.resolverConfigs = {registry: this.registry, ethrConfig: opts.ethrConfig, muportConfig: opts.muportConfig }

    // TODO can resolver configs not be passed through
    this.credentials = new Credentials(Object.assign(this.keypair, this.resolverConfigs))
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
  *  @return          {UportSubprovider}    A web3 style provider wrapped with uPort functionality
  */
  getProvider () {
    // TODO remove defaults, fix import
    const subProvider = new provider.default({
      requestAddress: () => {
        const requestID = 'addressReqProvider'
        this.requestDisclosure({accountType: this.accountType || 'keypair'}, requestID)
        return this.onResponse(requestID).then(payload => this.address)
      },
      sendTransaction: (txObj) => {
        delete txObj['from']
        const requestID = 'txReqProvider'
        this.sendTransaction(txObj, requestID)
        return this.onResponse(requestID).then(payload => payload.res)
      },
      provider: this.provider,
      networkId: this.network.id
    })
    if (this.address) subProvider.setAccount(this.address)
    return subProvider
  }

  // TODO offer listener and single resolve? or other both for this funct, by allowing optional cb instead
  /**
   *  Get response by id of earlier request, returns promise which resolves when first reponse with given id is available. Listen instead, if looking for multiple responses of same id.
   *
   *  @param    {String}    id             id of request you are waiting for a response for
   *  @return   {Promise<Object, Error>}   promise resolves once valid response for given id is avaiable, otherwise rejects with error
   */
  onResponse(id) {
    const parseResponse = (payload) => {
      if (payload.error) return Promise.reject(Object.assign({id}, payload))
      if (message.util.isJWT(payload.res)) {
        const jwt = payload.res
        const decoded = decodeJWT(jwt)
        if (decoded.payload.claim){
          return Promise.resolve(Object.assign({id}, payload))
        }
        return this.verifyResponse(jwt).then(res => {
          // Set identifiers present in the response
          if (res.address) this.address = res.address
          if (res.mnid) this.mnid = mnid
          if (res.did) this.did = res.did
          // Setup push transport if response contains pushtoken
          if (res.boxPub) this.publicEncKey = res.boxPub
          if (res.pushToken) this.pushToken = res.pushToken
          return {id, res, data: payload.data}
        })
      } else {
        return Promise.resolve(Object.assign({id}, payload))
      }
    }

    if (this.onloadResponse && this.onloadResponse.id === id) {
      const onloadResponse = this.onloadResponse
      this.onloadResponse = null
      if (this.storage) this.setState()
      return parseResponse(onloadResponse).then(res => {
        if (this.storage) this.setState()
        return res
      })
    }

    return new Promise((resolve, reject) => {
      this.PubSub.subscribe(id, (msg, res) => {
        this.PubSub.unsubscribe(id)
        parseResponse(res).then(res => {
          if (this.storage) this.setState()
          resolve(res)
        }, err => {
          reject(err)
        })
      })
    })
  }

  /**
   * @private
   * Extract relevant params from a payload from transports.url.listenResponse, and
   * pass them along to this.PubSub in the proper format
   * @param {Object} payload  the response from transports.url.listenrResponse
   */
  pubResponse (payload) {
    if (!payload || !payload.id) throw new Error('Response payload requires an id')
    this.PubSub.publish(payload.id, {res: payload.res, data: payload.data})
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

  //  TODO Name? request, transport or send?
 /**
  *  Send a request URI string to a uport client.
  *
  *  @param    {String}     request           a request message to send to a uport client
  *  @param    {String}     id                id of request you are looking for a response for
  *  @param    {Object}     [opts]            optional parameters for a callback, see (specs for more details)[https://github.com/uport-project/specs/blob/develop/messages/index.md]
  *  @param    {String}     opts.redirectUrl  If on mobile client, the url you want to the uPort client to return control to once it completes it's flow. Depending on the params below, this redirect can include the response or it may be returned to the callback in the request token.
  *  @param    {String}     opts.data         A string of any data you want later returned with response. It may be contextual to the original request.
  *  @param    {String}     opts.type         Type specifies the callback action. 'post' to send response to callback in request token or 'redirect' to send response in redirect url.
  *  @param    {Function}   opts.cancel       When using the default QR, but handling the response yourself, this function will be called when a users closes the request modal.
  */
  request (request, id, {redirectUrl, data, type, cancel} = {}) {
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
  *  @param    {Object}       abi                                   contract ABI
  *  @return   {Object}                                             contract object
  */
  contract (abi) {
    //TODO could have default id as method name instead of txReq?
    const txObjHandler = (txObj, id) => {
      txObj.fn = txObj.function
      delete txObj['function']
      return this.sendTransaction(txObj, id)
    }
    return ContractFactory(txObjHandler.bind(this))(abi)
  }

  /**
   *  Given a transaction object (similarly defined as the web3 transaction object)
   *  it creates a transaction sign request and sends it.
   *
   *  @example
   *  const txobject = {
   *    to: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347',
   *    value: '0.1',
   *    function: "setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347')",
   *    appName: 'MyDapp'
   *  }
   *  connect.sendTransaction(txobject, 'setStatus')
   *  connect.onResponse('setStatus').then(res => {
   *    const txId = res.res
   *  })
   *
   *  @param    {Object}    txObj
   *  @param    {String}    [id='txReq']    string to identify request, later used to get response
   */
   sendTransaction (txObj, id='txReq') {
     txObj.to = isMNID(txObj.to) ? txObj.to : encode({network: this.network.id, address: txObj.to})
     this.credentials.txRequest(txObj, {callbackUrl: this.genCallback(id)})
                     .then(jwt => this.request(jwt, id))
   }

  //  TODO this name is confusing
  /**
   *  Request uPort client/user to sign a claim or list of claims
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
   *  connect.createVerificationRequest(unsignedClaim).then(jwt => {
   *    ...
   *  })
   *
   *  @param    {Object}      reqObj                 object with request params
   *  @param    {Object}      reqObj.unsignedClaim   an object that is an unsigned claim which you want the user to attest
   *  @param    {String}      reqObj.sub             the DID which the unsigned claim is about
   *  @param    {String}      [id='signClaimReq']    string to identify request, later used to get response
   */
  createVerificationRequest (reqObj, id = 'signClaimReq') {
    this.credentials.createVerificationRequest(reqObj.unsignedClaim, reqObj.sub, this.genCallback(id), this.did)
      .then(jwt => this.request(jwt, id))
  }

  /**
   *  Creates a [Selective Disclosure Request JWT](https://github.com/uport-project/specs/blob/develop/messages/sharereq.md)
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
   *  @param    {Object}             [reqObj={}]           request params object
   *  @param    {Array}              reqObj.requested      an array of attributes for which you are requesting credentials to be shared for
   *  @param    {Array}              reqObj.verified       an array of attributes for which you are requesting verified credentials to be shared for
   *  @param    {Boolean}            reqObj.notifications  boolean if you want to request the ability to send push notifications
   *  @param    {String}             reqObj.callbackUrl    the url which you want to receive the response of this request
   *  @param    {String}             reqObj.network_id     network id of Ethereum chain of identity eg. 0x4 for rinkeby
   *  @param    {String}             reqObj.accountType    Ethereum account type: "general", "segregated", "keypair", or "none"
   *  @param    {Number}             reqObj.expiresIn      Seconds until expiry
   *  @param    {String}            [id='disclosureReq']   string to identify request, later used to get response
   *  @return   {Promise<Object, Error>}                   a promise which resolves with a signed JSON Web Token or rejects with an error
   */
  requestDisclosure (reqObj, id = 'disclosureReq') {
    reqObj = Object.assign({
      accountType: this.accountType || 'none',
      callbackUrl: this.genCallback(id)
    }, reqObj)
    this.credentials.requestDisclosure(reqObj, reqObj.expiresIn)
      .then(jwt => this.request(jwt, id))
  }

  /**
   *  Create a credential about connnected user
   *
   *  @example
   *  connect.attest({
   *   sub: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54',
   *   exp: <future timestamp>,
   *   claim: { name: 'John Smith' }
   *  }, 'REQUEST_ID')
   *  connect.onResponse('REQUEST_ID').then(credential => {
   *   ...
   *  })
   *
   * @param    {Object}            [credential]           a unsigned credential object
   * @param    {String}            credential.claim       claim about subject single key value or key mapping to object with multiple values (ie { address: {street: ..., zip: ..., country: ...}})
   * @param    {String}            credential.exp         time at which this claim expires and is no longer valid (seconds since epoch)
   * @param    {String}            [id='attestReq']       string to identify request, later used to get response
   */
  attest (credential, id) {
    this.credentials.attest(credential).then(jwt => this.request(jwt, id))
  }

  /**
   * Update the internal state of the connect instance and ensure that it is consistent
   * with the state saved to localStorage.  You can pass in a serialized state object to
   * restore a previous connect state, an object containing key-value pairs to update,
   * or a function that returns updated key-value pairs as a function of the current state
   *
   * @param {Function|String|Object} Update -- An object, serialized object string, or reducer
   *                                           function specifying updates to the current Connect
   *                                           state (as a function of the current state)
   */
  setState(update) {
    switch (typeof update) {
      case 'object':
        this._state = { ...this._state, ...update }
        break
      case 'function':
        this._state = { ...this._state, ...update(this._state) }
        break
      case 'string':
        this._state = { ...this._state, ...JSON.parse(update) }
        break
      case 'undefined':
        break
      default:
        throw new Error(`Cannot update state with ${update}`)
    }

    if (this.publicEncKey && this.pushToken) {
      this.pushTransport = pushTransport(this.pushToken, this.publicEncKey)
    }

    // Write to localStorage
    if (this.storage) {
      store.set('connectState', JSON.stringify(this._state))
    }
  }

  /**
   * Load state from local storage and set this instance's state accordingly.
   * Additionally returns the serialized string for you to manually save the
   * Connect instance's state somewhere else.
   *
   * @returns {String} The serialized connect state
   */
  getState() {
    const serialized = store.get('connectState')
    const { address, mnid, did, doc, keypair, pushToken, publicEncKey } = JSON.parse(serialized || '{}')
    this._state = { address, mnid, did, doc, keypair, pushToken, publicEncKey }

    return JSON.stringify(this._state)
  }

  /**
   * Clear any user-specific state from the browser, (both the Connect instance and localStorage)
   * effectively logging them out. The keypair (app-instance identity) is preserved
   */
  logout() {
    // Clear explicit state
    this.setState({
      did: null,
      mnid: null,
      address: null,
      doc: null,
      pushToken: null,
      publicEncKey: null
    })

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
   */
  get did ()          { return this._state.did }
  get doc ()          { return {...this._state.doc} }
  get mnid ()         { return this._state.mnid }
  get address ()      { return this._state.address }
  get keypair ()      { return {...this._state.keypair} }
  get pushToken ()    { return this._state.pushToken }
  get publicEncKey () { return this._state.publicEncKey }

  /**
   * Setter methods with appropriate validation
   */
  set did (did)                   { this.setState({did}) }
  set doc (doc)                   { this.setState({doc}) }
  set mnid (mnid)                 { this.setState(this.mnidDecode(mnid)) }
  set address (address)           { this.setState(this.mnidDecode(address)) }
  set keypair (keypair)           { this.setState({keypair}) }
  set pushToken (pushToken)       { this.setState({pushToken}) }
  set publicEncKey (publicEncKey) { this.setState({publicEncKey}) }

  /**
   * Utility method for disambiguating an address or mnid;
   * Receives either and return an object containing both, encoded according to this.network.id
   *
   * @param   {String}  addressOrMnid   -- A string containing an address or an mnid
   * @returns {Object}  addressAndMnid  -- an object with propreties address, and mnid containing both
   */
  mnidDecode(addressOrMnid) {
    if (!addressOrMnid) return {adddress: undefined, mnid: undefined}
    const address = isMNID(addressOrMnid) ? decode(addressOrMnid).address : addressOrMnid
    const mnid = isMNID(addressOrMnid) ? addressOrMnid : encode({network: this.network.id, address: addressOrMnid})
    return {address, mnid}
  }

  /**
   *  @private
   */
  genCallback(reqId) {
    return this.isOnMobile ?  windowCallback(reqId) : transport.messageServer.genCallback()
  }
}

/**
 *  A transport created for uport connect. Bundles transport functionality from uport-transports. This implements the
 *  default QR modal flow on desktop clients. If given a request which uses the messaging server Chasqui to relay
 *  responses, it will by default poll Chasqui and return response. If given a request which specifies another
 *  callback to receive the response, for example your own server, it will show the request in the default QR
 *  modal and then instantly return. You can then handle how to get the response specific to your implementation.
 *
 *  @param    {String}       appName                 App name to displayed in QR code pop over modal
 *  @return   {Function}                             Configured connectTransport function
 *  @param    {String}       uri                     uPort client request URI
 *  @param    {Object}       [config={}]             Optional config object
 *  @param    {String}       config.data             Additional data to be returned later with response
 *  @return   {Promise<Object, Error>}               Function to close the QR modal
 *  @private
 */
const connectTransport = (appName) => (uri, {data, cancel}) => {
  if (transport.messageServer.isMessageServerCallback(uri)) {
    return  transport.qr.chasquiSend({appName})(uri).then(res => ({res, data}))
  } else {
    transport.qr.send()(uri, {cancel})
    // TODO return close QR func?
    return Promise.resolve({data})
  }
}

/**
 * Wrap push transport from uport-transports, providing stored pushToken and publicEncKey from the
 * provided connect instance
 * @param   {Connect} connect   The Connect instance holding the pushToken and publicEncKey
 * @returns {Function}          Configured pushTransport function
 * @private
 */
const pushTransport = (pushToken, publicEncKey) => {
  const send = transport.push.send(pushToken, publicEncKey)

  return (uri, {message, type, redirectUrl, data}) => {
    if (transport.messageServer.isMessageServerCallback(uri)) {
      return transport.messageServer.URIHandlerSend(send)(uri, {message, type, redirectUrl})
        .then(res => ({res, data}))
    } else {
      // Return immediately for custom message server
      send(uri, {message, type, redirectUrl})
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

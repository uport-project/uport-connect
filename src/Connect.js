import { Credentials, ContractFactory } from 'uport'
import MobileDetect from 'mobile-detect'
import HttpProvider from 'web3/lib/web3/httpprovider' // Can use http provider from ethjs in the future.
import { isMNID, encode, decode } from 'mnid'
import { transport, message, network, provider } from 'uport-core'
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
   * @param    {String}      [opts.accountType]           Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none"
   * @param    {Boolean}     [opts.isMobile]              Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client
   * @param    {Boolean}     [opts.storage=true]          When true, object state will be written to local storage on each state cz-conventional-change
   * @param    {Function}    [opts.transport]             Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client
   * @param    {Function}    [opts.mobileTransport]       Configured by default by detecting client, but can optionally pass boolean to indicate whether this is instantiated on a mobile client
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
    this.accountType = opts.accountType
    this.isOnMobile = opts.isMobile === undefined ? isMobile() : opts.isMobile
    this.storage = opts.storage === undefined ? true : opts.storage
    // Transports
    this.transport = opts.transport || connectTransport(appName)
    this.mobileTransport = opts.mobileTransport || transport.url.send()
    this.onloadResponse = opts.onloadResponse || transport.url.getResponse()
    this.PubSub = PubSub

    // Probably move out of constructor
    this.pubResponse = (payload) => {
      if(!payload.id) throw new Error('Response payload requires and id')
      this.PubSub.publish(payload.id, {res: payload.res, data: payload.data})
    }

    transport.url.listenResponse((err, payload) => {
      if (payload) this.pubResponse(payload)
    })

    // State
    this.did = null
    this.mnid = null
    this.address = null
    this.firstReq = true // Add firstReq?
    // this.doc = null // Add this.doc?

    // Load any existing state if any
    if (this.storage)  this.getState()
    if (!this.keypair) this.keypair = Credentials.createIdentity()
    if (this.storage)this.setState()
    // Credential (uport-js) config for verification
    this.registry = opts.registry || UportLite({ networks: network.config.networkToNetworkSet(this.network) })
    // TODO can resolver configs not be passed through
    this.credentials = new Credentials(Object.assign(this.keypair, {registry: this.registry, ethrConfig: opts.ethrConfig, muportConfig: opts.muportConfig }))
    this.verifyResponse = this.credentials.verifyProfile.bind(this.credentials)
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
        this.requestAddress('addressReqProvider')
        return this.onResponse('addressReqProvider').then(payload => {
          this.setDID(payload.res.address)
          return this.address
        })

      },
      sendTransaction: (txObj) => {
        delete txObj['from']
        this.sendTransaction(txObj, 'txReqProvider')
        return this.onResponse('txReqProvider').then(payload => payload.res)
      },
      provider: this.provider,
      networkId: this.network.id
    })
    if (this.address) subProvider.setAccount(this.address)
    return subProvider
  }

// TODO where to return MNID and where to return address, should this be named differently, will return entire response obj now, not just address
// TODO requestID? requestAddress? return mnid, address, did in response??
// TODO add account option, param
 /**
  *  Creates a request for only the address/id of the uPort identity.
  *
  *  @example
  *  connect.requestAddress()
  *
  *  connect.onResponse('addressReq').then(res => {
  *    const id = res.res
  *  })
  *
  *  @param    {String}    [id='addressReq']    string to identify request, later used to get response
  */
  requestAddress (id='addressReq') {
    this.credentials.requestDisclosure({callbackUrl: this.genCallback()})
                    .then(jwt => this.request(jwt, id))
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
            this.setDID(res.address)
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

  //  TODO Name? request, transport or send?
 /**
  *  Send a request URI string to a uport client.
  *
  *  @param    {String}     uri               a request URI to send to a uport client
  *  @param    {String}     id                id of request you are looking for a response for
  *  @param    {Object}     [opts]            optional parameters for a callback, see (specs for more details)[https://github.com/uport-project/specs/blob/develop/messages/index.md]
  *  @param    {String}     opts.redirectUrl  If on mobile client, the url you want to the uPort client to return control to once it completes it's flow. Depending on the params below, this redirect can include the response or it may be returned to the callback in the request token.
  *  @param    {String}     opts.data         A string of any data you want later returned with response. It may be contextual to the original request.
  *  @param    {String}     opts.type         Type specifies the callback action. 'post' to send response to callback in request token or 'redirect' to send response in redirect url.
  *  @param    {Function}   opts.cancel       When using the default QR, but handling the response yourself, this function will be called when a users closes the request modal.
  */
  request (req, id, {redirectUrl, data, type, cancel} = {}) {
    console.log(req)
    const uri = message.util.isJWT(req) ? message.util.tokenRequest(req) : req
    if (!id) throw new Error('Requires request id')
    this.isOnMobile ? this.mobileTransport(uri, {id, data, redirectUrl, type}) : this.transport(uri, {data, cancel}).then(res => { this.PubSub.publish(id, res)})
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
   *  @param    {String}    [id='addressReq']    string to identify request, later used to get response
   */
   sendTransaction (txObj, id='txReq') {
     txObj.to = isMNID(txObj.to) ? txObj.to : encode({network: this.network.id, address: txObj.to})
     this.credentials.txRequest(txObj, {callbackUrl: this.genCallback()})
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
 *    sub: "2oTvBxSGseWFqhstsEHgmCBi762FbcigK5u"
 *  }
 *  credentials.createVerificationRequest(unsignedClaim).then(jwt => {
 *    ...
 *  })
 *
 *  @param    {Object}      reqObj                 object with request params
 *  @param    {Object}      reqObj.unsignedClaim   an object that is an unsigned claim which you want the user to attest
 *  @param    {String}      reqObj.sub             the DID which the unsigned claim is about
 *  @param    {String}      [id='signClaimReq']    string to identify request, later used to get response
 */
  createVerificationRequest(reqObj, id='signClaimReq') {
    this.credentials.createVerificationRequest(reqObj.unsignedClaim, reqObj.sub, this.genCallback(), this.did)
                    .then(jwt => his.request(jwt, id))
  }

  /**
 *  Creates a [Selective Disclosure Request JWT](https://github.com/uport-project/specs/blob/develop/messages/sharereq.md)
 *
 *  @example
 *  const req = { requested: ['name', 'country'],
 *                callbackUrl: 'https://myserver.com',
 *                notifications: true }
 *  credentials.requestDisclosure(req).then(jwt => {
 *      ...
 *  })
 *
 *  @param    {Object}             [params={}]           request params object
 *  @param    {Array}              params.requested      an array of attributes for which you are requesting credentials to be shared for
 *  @param    {Array}              params.verified       an array of attributes for which you are requesting verified credentials to be shared for
 *  @param    {Boolean}            params.notifications  boolean if you want to request the ability to send push notifications
 *  @param    {String}             params.callbackUrl    the url which you want to receive the response of this request
 *  @param    {String}             params.network_id     network id of Ethereum chain of identity eg. 0x4 for rinkeby
 *  @param    {String}             params.accountType    Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none"
 *  @param    {Number}             params.expiresIn      Seconds until expiry
 *  @param    {String}            [id='disclosureReq']    string to identify request, later used to get response
 *  @return   {Promise<Object, Error>}                   a promise which resolves with a signed JSON Web Token or rejects with an error
 */
  requestDisclosure (reqObj, id='disclosureReq') {
    this.credentials.requestDisclosure(Object.assign(reqObj, {callbackUrl: this.genCallback()}), reqObj.expiresIn)
                    .then(jwt => this.request(jwt, id))
  }

  /**
  *  Create a credential about connnected user
  *
  *  @example
  *  credentials.attest({
  *   sub: '5A8bRWU3F7j3REx3vkJ...', // uPort address of user, likely a MNID
  *   exp: <future timestamp>,
  *   claim: { name: 'John Smith' }
  *  }).then( credential => {
  *   ...
  *  })
  *
  * @param    {Object}            [credential]           a unsigned credential object
  * @param    {String}            credential.claim       claim about subject single key value or key mapping to object with multiple values (ie { address: {street: ..., zip: ..., country: ...}})
  * @param    {String}            credential.exp         time at which this claim expires and is no longer valid (seconds since epoch)
  * @param    {String}            [id='attestReq']       string to identify request, later used to get response
  */
  attest (claim, id) {
    this.credentials.attest(claim).then(jwt => {this.request(jwt, id)})
  }

 /**
  *  Serializes persistant state of Connect object to string. Persistant state includes following
  *  keys and values; address, mnid, did, doc, firstReq, keypair. You can save this string how you
  *  like and then restore it's state with the deserialize function.
  *
  *  @return   {String}   JSON string
  */
  serialize() {
    // TODO these are redundant vals, just store did maybe
    const connectJSONState = {
      address: this.address,
      mnid: this.mnid,
      did: this.did,
      // doc: this.doc,
      firstReq: this.firstReq,
      keypair: this.keypair
    }
    return JSON.stringify(connectJSONState)
  }

  /**
   *  Given string of serialized Connect state, it restores that given state to the Connect
   *  object which it was called on. You can get the serialized state of a connect object
   *  by calling the serialize() function.
   *
   *  @param    {String}    str      serialized uPort Connect state
   */
  deserialize(str) {
    const state = JSON.parse(str)
    this.address = state.address
    this.mnid = state.mnid
    this.did = state.did
    // this.doc = state.doc
    this.firstReq = state.firstReq
    this.keypair = state.keypair
  }

  /**
   *  Gets uPort connect state from browser localStorage and sets on this object
   */
  getState() {
    const connectState = store.get('connectState')
    if (connectState) this.deserialize(connectState)
  }

    /**
     *  Writes serialized uPort connect state to browser localStorage at key 'connectState'
     */
  setState() {
    const connectState = this.serialize()
    store.set('connectState', connectState)
  }

  /**
   * Set DID on object, also sets decoded mnid and address
   */
  setDID(did) {
    this.did = did
    // TODO change so doesn't fail, but need fix all handling of did vs addreess vs mnid throughout code here and above
    const address = did.replace('did:ethr:', '').replace('did:uport:', '')
    // TODO address should be nad
    this.mnid = isMNID(address) ? address : encode({network: 'Ox1', address})
    this.address = isMNID(address) ? decode(address).address : address
  }

  /**
   *  @private
   */
  genCallback() {
    return this.isOnMobile ?  windowCallback() : transport.chasqui.genCallback()
  }
}

/**
 *  A transport created for uport connect. Bundles transport functionality from uport-core-js. This implements the
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
  if (transport.chasqui.isChasquiCallback(uri)) {
    return  transport.qr.chasquiSend({appName})(uri).then(res => ({res, data}))
  } else {
    transport.qr.send()(uri, {cancel})
    // TODO return close QR func?
    return Promise.resolve({data})
  }
}

/**
 *  Gets current window url and formats as request callback
 *
 *  @return   {String}   Returns window url formatted as callback
 *  @private
 */
const windowCallback = () => {
  const md = new MobileDetect(navigator.userAgent)
  if( md.userAgent() === 'Chrome' && md.os() === 'iOS' ) {
    return `googlechrome:${window.location.href.substring(window.location.protocol.length)}`
  } else {
    return  window.location.href
  }
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

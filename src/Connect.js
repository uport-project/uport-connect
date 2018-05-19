import { Credentials, ContractFactory } from 'uport'
import MobileDetect from 'mobile-detect'
import HttpProvider from 'web3/lib/web3/httpprovider' // Can use http provider from ethjs in the future.
import { isMNID, encode, decode } from 'mnid'
import { transport, message, network, provider } from 'uport-core'
import PubSub from 'pubsub-js'
import store from  'store'

// Remove this after or find a better place for it
import UportDIDResolver from 'uport-did-resolver'
import EthrDIDResolver from 'ethr-did-resolver'
import { verifyJWT,  decodeJWT } from 'did-jwt'
import UportLite from 'uport-lite'

class Connect {

  /**
   * Instantiates a new uPort Connect object.
   *
   * @example
   * import { Connect } from 'uport-connect'
   * const uPort = new ConnectCore('Mydapp')
   * @param       {String}            appName                the name of your app
   * @param       {Object}            [opts]                 optional parameters
   * @param       {String}            opts.clientId          uport identifier for your application this will be used in the default credentials object
   * @param       {Object}            [opts.network='rinkeby'] network config object or string name, ie. { id: '0x1', registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten', 'rinkeby'.
   * @param       {String}            opts.infuraApiKey      Infura API Key (register here http://infura.io/register.html)
   * @param       {Function}          opts.topicFactory      function which generates topics and deals with requests and response
   * @param       {Function}          opts.uriHandler        default function to consume generated URIs for requests, can be used to display QR codes or other custom UX
   * @param       {Function}          opts.mobileUriHandler  default function to consume generated URIs for requests on mobile
   * @param       {Function}          opts.closeUriHandler   default function called after a request receives a response, can be to close QR codes or other custom UX
   * @param       {String}            opts.accountType       Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none"
   * @param       {Object}            opts.ethrConfig        Configuration object for ethr did resolver. See [ethr-did-resolver](https://github.com/uport-project/ethr-did-resolver)
   * @return      {Connect}                                  self
   */
  constructor (appName, opts = {}) {
    // Config
    this.appName = appName || 'uport-connect-app'
    this.network = network.config.network(opts.network)
    this.infuraApiKey = opts.infuraApiKey || this.appName.replace(/\W+/g, '-')  //TODO Not used right now, still needed?
    this.provider = opts.provider || new HttpProvider(this.network.rpcUrl)
    this.accountType = opts.accountType
    this.isOnMobile = opts.isMobile === undefined ? isMobile() : opts.isMobile
    this.storage = opts.storage || true
    // State
    this.address = null
    this.firstReq = true
    // Transports
    this.transport = opts.transport || connectTransport(appName)
    this.mobileTransport = opts.mobileTransport || transport.url.send()
    this.PubSub = PubSub
    this.onloadResponse = transport.url.getResponse()
    transport.url.listenResponse((err, res) => {
      if (res) this.PubSub.publish(res.id, {res: res.res, data: res.data}) // TODO pass errors
    })

    this.mnid = null // Add this.mnid
    this.doc = null // Add this.doc
    this.keypair = null // Add this.keypair

    // Load any existing state if any
    if (this.storage)  this.getState()
    if (!this.keypair) this.keypair = Credentials.createIdentity()
    this.setState()

    // TODO need a nicer way configure resolvers, lines below should be temporary
    // TODO would be nice to have some uncoupled funct for parsing/verifying in uport-core-js rather than require config a credential object, nice to require aud either here
    this.registry = UportLite({ networks: network.config.networkToNetworkSet(this.network) })
    this.credentials = new Credentials(Object.assign(this.keypair, {registry: this.registry, ethrConfig: opts.ethrConfig}))
    this.verifyResponse = this.credentials.verifyProfile  //TODO verify profile name confusing
  }

 /**
  *  Instantiates and returns a web3 styple provider wrapped with uPort functionality.
  *  For more details see uportSubprovider. uPort overrides eth_coinbase and eth_accounts
  *  to start a get address flow or to return an already received address. It also
  *  overrides eth_sendTransaction to start the send transaction flow to pass the
  *  transaction to the uPort app.
  *
  *  @return          {UportSubprovider}    A web3 style provider wrapped with uPort functionality
  */
  getProvider () {
  // TODO remove defaults, fix import
  const subProvider = new provider.default({
    requestAddress: () => {
      this.requestAddress('addressReqProvider')
      // TODO can this be parsed to readable name (ie nad) address or network address or mnid
      return this.onResponse('addressReqProvider').then(res => decode(res.res.payload.nad).address)
    },
    sendTransaction: (txObj) => {
      txObj.bytecode = txObj.data
      this.sendTransaction(txObj, 'txReqProvider')
      return this.onResponse('txReqProvider')
    },
    provider: this.provider,
    networkId: this.network.id
  })
  if (this.address) subProvider.setAccount(this.address)
  return subProvider
  }

// TODO where to return MNID and where to return address, should this be named differently, will return entire response obj now, not just address
 /**
  *  Creates a request for only the address/id of the uPort identity.
  *
  *  @param    {String}    [id='addressReq']    string to identify request, later used to get response
  */
  requestAddress (id='addressReq') {
    this.credentials.requestDisclosure({callbackUrl: transport.chasqui.genCallback()}).then(jwt => {this.request(tokenRequest(jwt), id)})
  }

 // TODO offer listener and single resolve? or other both for this funct, by allowing optional cb instead
 /**
  *  Get response by id of earlier request, returns promise which resolves when first reponse with given id is avaialable. Listen instead, if looking for multiple responses of same id.
  *
  *  @param    {String}    id             id of request you are looking for a response for
  *  @return   {Promise<Object, Error>}   promise resolves once valid response for given id is avaiable, otherwise rejects with error
  */
  onResponse(id) {
    const parseResponse = (resObj) => {
      if (isJWT(resObj.res)) {
        return this.verifyResponse(resObj.res).then(res => ({id, res, data: resObj.data}))
      } else {
        return Promise.resolve(Object.assign({id}, resObj))
      }
    }

    if (this.onloadResponse && this.onloadResponse.id === id) {
      const onloadResponse = this.onloadResponse
      this.onloadResponse = null
      if (this.storage) this.setState()
      return parseResponse(onloadResponse)
    }

    return new Promise((resolve, reject) => {
      this.PubSub.subscribe(id, (msg, res) => {
        this.PubSub.unsubscribe(id)
        if (this.storage) this.setState()
        parseResponse(res).then(res => {resolve(res)}, err => {reject(err)})
      })
    })
  }

   // NOTE interface, some are cancellable?, maybe just allow devs to pass in cancel func instead?
  //  TODO Name? request, transport? send?
 /**
  *  Send a request URI string to a uport client
  *
  *  @param    {String}     uri            a request URI to send to a uport client
  *  @param    {String}     id             id of request you are looking for a response for
  *  @param    {Object}     [opts]         optional parameters for a callback
  *  @param    {String}     opts.callback  callback TODO ref specs here for cb, data, type and diff between signed and unsigned req
  *  @param    {String}     opts.data
  *  @param    {String}     opts.type
  *  @return   {Promise<Object, Error>}   promise resolves once valid response for given id is avaiable, otherwise rejects with error
  */
  request (uri, id, {callback, data, type} = {}) {
   this.isOnMobile ? this.mobileTransport(uri, {id, data, callback, type}) : this.transport(uri, {data}).then(res => { this.PubSub.publish(id, res)})
  }

 /**
  *  Builds and returns a contract object which can be used to interact with
  *  a given contract. Similar to web3.eth.contract but with promises. Once specifying .at(address)
  *  you can call the contract functions with this object. It will create a request,
  *  call the uirHandler with the URI, and return a promise which resolves with
  *  a transtaction ID.
  *
  *  @param    {Object}       abi                                   contract ABI
  *  @return   {Object}                                             contract object
  */
  contract (abi) {
    const txObjectHandler = (methodTxObject, id) => this.sendTransaction(methodTxObject, id)
    return ContractFactory(txObjectHandler)(abi)
  }

  /**
   *  Given a transaction object, similarly defined as the web3 transaction object,
   *  it creates a URI which is passes to the uirHandler. It will create request
   *  and returns a promise which resolves with the transaction id.
   *
   *  @example
   *  const txobject = {
   *    to: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347',
   *    value: '0.1',
   *    function: "setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347')",
   *    appName: 'MyDapp'
   *  }
   *  connect.sendTransaction(txobject).then(txID => {
   *    ...
   *  })
   *
   *  @param    {Object}    txObj
   *  @param    {String}    [id='addressReq']    string to identify request, later used to get response
   */
   sendTransaction (txObj, id='txReq') {
     txObj.to = isMNID(txObj.to) ? txObj.to : encode({network: this.network.id, address: txObj.to})
     this.credentials.txRequest(txObj, {callbackUrl: transport.chasqui.genCallback()}).then(jwt => this.request(tokenRequest(txObj), id))
   }

 /**
  *  Serializes persistant state of Connect object to string. Persistant state includes following
  *  keys and values; address, mnid, did, doc, firstReq, keypair. You can save this string how you
  *  like and then restore it's state with the deserialize function.
  *
  *  @return   {String}   JSON string
  */
  serialize() {
    const connectJSONState = {
      address: this.address,
      mnid: this.mnid,
      did: this.did,
      doc: this.doc,
      firstReq: this.firstReq,
      keypair: this.keypair
    }
    return JSON.stringify(connectJSONState)
  }

  /**
   *  Given string of serialized Connect state, it restores that given state to the Connect
   *  object which it was called on.
   *
   *  @param    {String}    str      serialized Connect state
   */
  deserialize(str) {
    const state = JSON.parse(str)
    this.address = state.address
    this.mnid = state.mnid
    this.did = state.did
    this.doc = state.doc
    this.firstReq = state.firstReq
    this.keypair = state.keypair
  }

  getState() {
    const connectState = store.get('connectState')
    if (connectState) this.deserialize(connectState)
  }

  setState() {
    const connectState = this.serialize()
    store.set('connectState', connectState)
  }
}

// TODO this simple function should be some where in uportcore and/or js to make this more clear
const tokenRequest = (jwt) =>  `https://id.uport.me/req/${jwt}`
const isJWT = (jwt) => /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/.test(jwt)

const connectTransport = (appName) => (uri, {data}) => {
  if (transport.chasqui.isChasquiCallback(uri)) {
    return  transport.qr.chasquiSend({appName})(uri).then(res => ({res, data}))
  } else {
    transport.qr.send()(uri)
    // return closeQR ??
    return Promise.resolve({data})
  }
}

/**
 *  Detects if this library is called on a mobile device or tablet.
 *
 *  @param    {Object}     params    A object of params known to uPort
 *  @return   {Boolean}              Returns true if on mobile or tablet, false otherwise.
 *  @private
 */
function isMobile () {
  if (typeof navigator !== 'undefined') {
    return !!(new MobileDetect(navigator.userAgent).mobile())
  } else return false
}

export default Connect

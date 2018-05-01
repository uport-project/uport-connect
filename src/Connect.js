import { Credentials, ContractFactory } from 'uport'
import MobileDetect from 'mobile-detect'
import UportSubprovider from './uportSubprovider'
// Can use http provider from ethjs in the future.
import HttpProvider from 'web3/lib/web3/httpprovider'
import { isMNID, encode, decode } from 'mnid'
import { transport, message } from 'uport-core'
import PubSub from 'pubsub-js'

//TODO Import network configs from other repos and move config network to
const networks = {
  'mainnet':   {  id: '0x1',
                  registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6',
                  rpcUrl: 'https://mainnet.infura.io' },
  'ropsten':   {  id: '0x3',
                  registry: '0x41566e3a081f5032bdcad470adb797635ddfe1f0',
                  rpcUrl: 'https://ropsten.infura.io' },
  'kovan':     {  id: '0x2a',
                  registry: '0x5f8e9351dc2d238fb878b6ae43aa740d62fc9758',
                  rpcUrl: 'https://kovan.infura.io' },
  'rinkeby':   {  id: '0x4',
                  registry: '0x2cc31912b2b0f3075a87b3640923d45a26cef3ee',
                  rpcUrl: 'https://rinkeby.infura.io' }
}

const DEFAULTNETWORK = 'rinkeby'

const configNetwork = (net = DEFAULTNETWORK) => {
  if (typeof net === 'object') {
    ['id', 'registry', 'rpcUrl'].forEach((key) => {
      if (!net.hasOwnProperty(key)) throw new Error(`Malformed network config object, object must have '${key}' key specified.`)
    })
    return net
  } else if (typeof net === 'string') {
    if (!networks[net]) throw new Error(`Network configuration not available for '${net}'`)
    return networks[net]
  }

  throw new Error(`Network configuration object or network string required`)
}

const connectTransport = (uri, {data}) => {
  if (/access_token/.test(uri)) {
    transport.qr.send()(uri)
    // return closeQR ??
    return Promise.resolve({data})
  } else {
    return  transport.qr.chasquiSend()(uri).then(res => ({res, data}))
  }
}

const simpleRequest = () =>  `https://id.uport.me/me`
const txRequest = (txObj) => message.util.paramsToQueryString(`me.uport:${txObj.to}`, txObj)
const isJWT = (jwt) => /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/.test(jwt)
const parseResponse = (resObj) => {
  if (isJWT(resObj.res)) {
    return this.verifyResponse(resObj.res).then(res => ({id, res, data: resObj.data}))
  } else {
    return Promise.resolve(Object.assign({id}, resObj))
  }
}


class Connect {

  /**
   * Instantiates a new uPort connectCore object.
   *
   * @example
   * import { ConnectCore } from 'uport-connect'
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
   *  @param      {String}            opts.accountType       Ethereum account type: "general", "segregated", "keypair", "devicekey" or "none"
   * @return      {Connect}                                  self
   */

  constructor (appName, opts = {}) {
    this.appName = appName || 'uport-connect-app'
    this.infuraApiKey = opts.infuraApiKey || this.appName.replace(/\W+/g, '-')  //Not used right now
    this.provider = opts.provider
    this.accountType = opts.accountType
    this.isOnMobile = opts.isMobile === undefined ? isMobile() : opts.isMobile
    this.network = configNetwork(opts.network)
    const credentialsNetwork = {[this.network.id]: {registry: this.network.registry, rpcUrl: this.network.rpcUrl}}
    this.credentials = opts.credentials || new Credentials({address: this.clientId, signer: opts.signer, networks: credentialsNetwork})
    this.address = null
    this.firstReq = true
    // Transports
    this.transport = opts.transport || connectTransport
    this.mobileTransport = opts.mobileTransport || transport.url.send()
    this.PubSub = PubSub
    this.onloadResponse = transport.url.getResponse()
    transport.url.listenResponse((err, res) => {
      if (res) this.PubSub.publish(res.id, {res: res.res, data: res.data})
    })
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
    const subProvider = new UportSubprovider({
      requestAddress: this.requestAddress.bind(this),
      sendTransaction: this.sendTransaction.bind(this),
      provider: this.provider || new HttpProvider(this.network.rpcUrl),
      networkId: this.network.id
    })
    if (this.address) subProvider.setAccount(this.address)
    return subProvider
  }

  /**
   *  Creates a request for only the address/id of the uPort identity.
   *
   *  @param    {String}    [id='addressReq']    string to identify request, later used to get response
   */
   requestAddress (id='addressReq') {
     this.request(simpleRequest(), id)
   }

 // TODO offer listener and single resolve? or other both for this funct, by allowing optional cb instead
 /**
  *  Get response by id of earlier request, returns promise which resolves when first reponse with given id is avaialable. Listen instead, if looking for multiple responses of same id.
  *
  *  @param    {String}    id             id of request you are looking for a response for
  *  @return   {Promise<Object, Error>}   promise resolves once valid response for given id is avaiable, otherwise rejects with error
  */
  onResponse(id) {
    if (this.onloadResponse && this.onloadResponse.id === id) {
      const onloadResponse = this.onloadResponse
      this.onloadResponse = null
      return parseResponse(onloadResponse)
    }

    return new Promise((resolve, reject) => {
      this.PubSub.subscribe(id, (msg, res) => {
        this.PubSub.unsubscribe(id)
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
    const txObjectHandler = (methodTxObject) => this.sendTransaction(methodTxObject)
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
     this.request(txRequest(txObj), id)
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

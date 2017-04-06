import TopicFactory from './topicFactory'
import MobileDetect from 'mobile-detect'
import UportSubprovider from './uportSubprovider'
const INFURA_ROPSTEN = 'https://ropsten.infura.io'
// Can use http provider from ethjs in the future.
import HttpProvider from 'web3/lib/web3/httpprovider'
import { isMNID, encode } from 'mnid'
import { decodeToken } from 'jsontokens/lib/decode'
import { ContractFactory } from 'uport/lib/Contract'

import UportLite from 'uport-lite'

const networks = {
  'mainnet':   {  id: '0x1',
                  registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6',
                  rpcUrl: 'https://mainnet.infura.io' },
  'ropsten':   {  id: '0x3',
                  registry: '0x41566e3a081f5032bdcad470adb797635ddfe1f0',
                  rpcUrl: 'https://ropsten.infura.io' },
  'kovan':     {  id: '0x2a',
                  registry: '0x5f8e9351dc2d238fb878b6ae43aa740d62fc9758',
                  rpcUrl: 'https://kovan.infura.io' }
  // 'infuranet': {  id: '0x2a'
  //                 registry: '',
  //                 rpcUrl: 'https://infuranet.infura.io' }
}

const DEFAULTNETWORK = 'ropsten'

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

/**
*  Primary object for frontend interactions with uPort. ConnectCore excludes
*  some functionality found in Connect for a more customizable and lightweight integration.
*  It does not provide any web3 functionality althought you can still use getProvider
*  to get a provider to use with web3 or other libraries. It removes all default
*  QR injection functionality. Your can choose how you want to handle the UX and/or
*  QR generation and use any QR library you choose. For example, if used in a
*  mobile native app QR generation is not even necessary.
*
*/

class ConnectLite {

  /**
   * Instantiates a new uPort connectCore object.
   *
   * @example
   * import { ConnectCore } from 'uport-connect'
   * const uPort = new ConnectCore('Mydapp')
   * @param       {String}            appName                the name of your app
   * @param       {Object}            [opts]                 optional parameters
   * @param       {Object}            opts.credentials       pre-configured Credentials object from http://github.com/uport-project/uport-js object. Configure this if you need to create signed requests
   * @param       {Function}          opts.signer            signing function which will be used to sign JWT's in the credentials object
   * @param       {String}            opts.clientId          uport identifier for your application this will be used in the default credentials object
   * @param       {Object}            [opts.network='kovan'] network config object or string name, ie. { id: '0x1', registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten'.
   * @param       {String}            opts.infuraApiKey      Infura API Key (register here http://infura.io/register.html)
   * @param       {Function}          opts.topicFactory      function which generates topics and deals with requests and response
   * @param       {Function}          opts.uriHandler        default function to consume generated URIs for requests, can be used to display QR codes or other custom UX
   * @param       {Function}          opts.mobileUriHandler  default function to consume generated URIs for requests on mobile
   * @param       {Function}          opts.closeUriHandler   default function called after a request receives a response, can be to close QR codes or other custom UX
   * @return      {Connect}                                  self
   */

  constructor (appName, opts = {}) {
    this.appName = appName || 'uport-connect-app'
    this.infuraApiKey = opts.infuraApiKey || this.appName.replace(/\W+/g, '-')
    this.provider = opts.provider
    this.isOnMobile = opts.isMobile === undefined ? isMobile() : opts.isMobile
    this.topicFactory = opts.topicFactory || TopicFactory(this.isOnMobile)
    this.uriHandler = opts.uriHandler || defaultUriHandler
    this.mobileUriHandler = opts.mobileUriHandler
    this.network = configNetwork(opts.network)
    this.registry = UportLite({ networks: { [this.network.id]: { registry: this.network.registry, rpcUrl: this.network.rpcUrl }}})
    this.clientId = opts.clientId
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
    return new UportSubprovider({
      requestAddress: this.requestAddress.bind(this),
      sendTransaction: this.sendTransaction.bind(this),
      provider: this.provider || new HttpProvider(this.network.rpcUrl)
    })
  }

  /**
   *  Creates a request given a request object, will also always return the user's
   *  uPort address. Calls given uriHandler with the uri. Returns a promise to
   *  wait for the response.
   *
   *  @example
   *  const req = {requested: ['name', 'country']}
   *  connect.requestCredentials(req).then(credentials => {
   *      const address = credentials.address
   *      const name = credentials.name
   *      ...
   *  })
   *
   *  @param    {Object}                  [request={}]                    request object
   *  @param    {Function}                [uriHandler=this.uriHandler]    function to consume uri, can be used to display QR codes or other custom UX
   *  @return   {Promise<Object, Error>}                                  a promise which resolves with a response object or rejects with an error.
   */
  requestCredentials (request = {}, uriHandler) {
    if (request.requested && request.requested.length > 0) {
      return Promise.reject(new Error('Specific data can not be requested with ConnectLite'))
    }
    const topic = this.topicFactory('access_token')
    const uri = paramsToUri(this.addAppParameters({ to: 'me' }, topic.url))
    return new Promise((resolve, reject) => {
      this.request({uri, topic, uriHandler}).then(jwt => {
      const payload = decodeToken(jwt).payload
      this.registry(payload.iss, (err, profile) => {
        if (err) reject(new Error(err))
        if (!profile) return reject(new Error('No profile found'))
        resolve({...profile, address: payload.iss})
      })
    })
  })
  }

  /**
   *  Creates a request for only the address of the uPort identity. Calls given
   *  uriHandler with the uri. Returns a promise to wait for the response.
   *
   *  @param    {Function}                [uriHandler=this.uriHandler]    function to consume uri, can be used to display QR codes or other custom UX
   *  @return   {Promise<String, Error>}                                  a promise which resolves with an address or rejects with an error.
   */
  requestAddress (uriHandler) {
    return this.requestCredentials({}, uriHandler).then((profile) => profile.address)
  }

  /**
   *  Create a request and returns a promise which resolves the response. This
   *  function is primarly is used by more specified functions in this class, which
   *  allow you to easily create the URIs and messaging server topics you need here.
   *
   *  @param    {Object}     request                                request object
   *  @param    {String}     request.uri                            uPort URI
   *  @param    {String}     request.topic                          messaging server topic object
   *  @param    {String}     [request.uriHandler=this.uriHandler]   function to consume URI, can be used to display QR codes or other custom UX
   *  @return   {Promise<Object, Error>}                            promise which resolves with a response object or rejects with an error.
   */
  request ({uri, topic, uriHandler}) {
    const defaultUriHandler = !uriHandler
    if (defaultUriHandler) { uriHandler = this.uriHandler }

    // TODO consider UI for push notifications, maybe a popup explaining, then a loading symbol waiting for a response, a retry and a cancel button. should dev use uriHandler if using push notifications?
    (this.isOnMobile && this.mobileUriHandler)
      ? this.mobileUriHandler(uri)
      : uriHandler(uri, topic.cancel)

    if (defaultUriHandler && !this.isOnMobile && this.closeUriHandler) {
      // TODO maybe remove closeHandler????
      return new Promise((resolve, reject) => {
        topic.then(res => {
          this.closeUriHandler()
          resolve(res)
        }, error => {
          this.closeUriHandler()
          reject(error)
        })
      })
    } else return topic
  }

  /**
  *  Builds and returns a contract object which can be used to interact with
  *  a given contract. Similar to web3.eth.contract but with promises. Once specifying .at(address)
  *  you can call the contract functions with this object. It will create a request,
  *  call the uirHandler with the URI, and return a promise which resolves with
  *  a transtaction ID.
  *
  *  @param    {Object}       abi                                   contract ABI
  *  @param    {Function}     [request.uriHandler=this.uriHandler]  function to consume uri, can be used to display QR codes or other custom UX
  *  @return   {Object}                                             contract object
  */
  contract (abi) {
    const txObjectHandler = (methodTxObject, uriHandler) => this.sendTransaction(methodTxObject, uriHandler)
    return new ContractFactory(txObjectHandler)(abi)
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
   *    function: setStatus(string 'hello', bytes32 '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347'),
   *    appName: 'MyDapp'
   *  }
   *  connect.sendTransaction(txobject).then(txID => {
   *    ...
   *  })
   *
   *  @param    {Object}     txobj                                  transaction object, can also be wrapped using addAppParameters
   *  @param    {Function}   [request.uriHandler=this.uriHandler]   function to consume uri, can be used to display QR codes or other custom UX
   *  @return   {Promise<Object, Error>}                            A promise which resolves with a resonse object or rejects with an error.
   */
  sendTransaction (txobj, uriHandler = this.uriHandler) {
    const topic = this.topicFactory('tx')
    let uri = paramsToUri(this.addAppParameters(txobj, topic.url))
    return this.request({uri, topic, uriHandler})
  }

  /**
   *  Adds application specific data to a transaction object. Then uses this data
   *  when requests are created.
   *
   *  @param    {Object}     txobj             transaction object
   *  @param    {String}     callbackUrl       application callback url
   *  @return   {Promise<Object, Error>}       A promise which resolves with a resonse object or rejects with an error.
   */
  addAppParameters (txObject, callbackUrl) {
    const appTxObject = Object.assign({}, txObject)
    if (callbackUrl) {
      appTxObject.callback_url = callbackUrl
    }
    if (this.appName) {
      appTxObject.label = this.appName
    }
    if (this.clientId) {
      appTxObject.client_id = this.clientId
    }
    appTxObject.network_id = this.network.id
    return appTxObject
  }
}

/**
 *  Consumes a params object and creates URI for uPort mobile.
 *
 *  @param    {Object}     params    A object of params known to uPort
 *  @return   {Strings}              A uPort mobile URI
 *  @private
 */
const paramsToUri = (params) => {
  if (!params.to) {
    throw new Error('Contract creation is not supported by uportProvider')
  }
  params.to = isMNID(params.to) || params.to === 'me' ? params.to : encode({network: params.network_id, address: params.to})
  let uri = `me.uport:${params.to}`
  const pairs = []
  if (params.value) {
    pairs.push(['value', parseInt(params.value, 16)])
  }
  if (params.function) {
    pairs.push(['function', params.function])
  } else if (params.data) {
    pairs.push(['bytecode', params.data])
  }

  const paramsAdd = ['label', 'callback_url', 'client_id']
  if (params.to === 'me') paramsAdd.push['network_id']

  paramsAdd.map(param => {
    if (params[param]) {
      pairs.push([param, params[param]])
    }
  })
  return `${uri}?${pairs.map(kv => `${kv[0]}=${encodeURIComponent(kv[1])}`).join('&')}`
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

/**
 *  ConnectCore has no default URI handler, one must be set
 *
 *  @param    {Object}     uri    A uPort URI
 *  @return   {Error}             Throws Error
 *  @private
 */
function defaultUriHandler (uri) {
  throw new Error(`No Url handler set to handle ${uri}`)
}

export default ConnectLite

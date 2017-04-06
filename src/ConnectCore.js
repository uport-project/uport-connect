import { Credentials, ContractFactory } from 'uport'
import ConnectLite from './ConnectLite.js'
import { isMNID, encode } from 'mnid'


// TODO rewrite this
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

class ConnectCore extends ConnectLite{

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
   * @return      {Connect}                                  self
   */

  constructor (appName, opts = {}) {
    super(appName, opts)
    this.clientId = opts.clientId
    const credentialsNetwork = {[this.network.id]: {registry: this.network.registry, rpcUrl: this.network.rpcUrl}}
    this.credentials = opts.credentials || new Credentials({address: this.clientId, signer: opts.signer, networks: credentialsNetwork})
    // TODO throw error if this.network not part of network set in Credentials
    this.canSign = !!this.credentials.settings.signer && !!this.credentials.settings.address
    this.pushToken = null
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
    const self = this
    const receive = this.credentials.receive.bind(this.credentials)
    const topic = this.topicFactory('access_token')
    return new Promise((resolve, reject) => {
      if (this.canSign) {
        this.credentials.createRequest({...request, callbackUrl: topic.url}).then(requestToken =>
          resolve(`me.uport:me?requestToken=${encodeURIComponent(requestToken)}`)
        )
      } else {
        if (request.requested && request.requested.length > 0) {
          return reject(new Error('Specific data can not be requested without a signer configured'))
        }
        // TODO remove once enabled in mobile app
        if (request.notifications) {
          return reject(new Error('Notifications rights can not currently be requested without a signer configured'))
        }
        resolve(paramsToUri(this.addAppParameters({ to: 'me' }, topic.url)))
      }
    }).then(uri => self.request({uri, topic, uriHandler}))
      .then(jwt => receive(jwt, topic.url))
      .then(res => {
        if (res && res.pushToken) self.pushToken = res.pushToken
        return res
      })
  }

  /**
   *  Consumes a credential object and generates a signed JWT. Creates a request
   *  URI with the JWT. Calls given uriHandler with the URI. Returns a promise to wait
   *  for the response. Throws error if no signer and/or app identifier is set.
   *  Will not always receive a response, response is only a status.
   *
   *  @example
   *  const cred = {
   *    sub: '0xc3245e75d3ecd1e81a9bfb6558b6dafe71e9f347'
   *    claim: {'email': 'hello@uport.me'}
   *    exp: '1300819380'
   *  }
   *  connect.attestCredentials(cred).then(res => {
   *    // response okay, received in uPort app
   *  })
   *
   *  @param    {Object}            credential                      credential object
   *  @param    {String}            credential.sub                  subject of this credential
   *  @param    {Object}            credential.claim                statement(s) which this credential claims, contructed as {key: 'value', ...}
   *  @param    {String}            credential.exp                  expiry time of this credential
   *  @param    {Function}          [uriHandler=this.uriHandler]    function to consume uri, can be used to display QR codes or other custom UX
   *  @return   {Promise<Object, Error>}                            a promise which resolves with a resonse object or rejects with an error.
   */
  attestCredentials ({sub, claim, exp}, uriHandler) {
    const self = this
    const topic = this.topicFactory('status')
    return this.credentials.attest({ sub, claim, exp }).then(jwt => {
      return self.request({uri: `me.uport:add?attestations=${encodeURIComponent(jwt)}&callback_url=${encodeURIComponent(topic.url)}`, topic, uriHandler})
    })
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
    if (this.pushToken) {
      this.credentials.push(this.pushToken, {url: uri})
      return topic
    }
    return super.request({uri, topic, uriHandler})
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


export default ConnectCore

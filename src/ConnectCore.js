import TopicFactory from './topicFactory'
import { Credentials } from 'uport'
import MobileDetect from 'mobile-detect'
import { ContractFactory } from 'uport'
import UportSubprovider from './uportSubprovider'
const INFURA_ROPSTEN = 'https://ropsten.infura.io'
// Can use http provider from ethjs in the future.
import HttpProvider from 'web3/lib/web3/httpprovider'

// TODO Add simple QR wrapper for the orginal default flow, just means wrapping open/close functionality
// TODO add cancel back in, should be really simple now
// TODO extend this uport to uport with web3 so we can eventually have sepearte distributions.

function isMobile () {
  if (typeof navigator !== 'undefined') {
    return !!(new MobileDetect(navigator.userAgent).mobile())
  } else return false
}

/**
 * This class is the main entry point for interaction with uport.
 */
class Connect {

  /**
   * Creates a new uport object.
   *
   * @memberof    Uport
   * @method      constructor
   * @param       {String}            appName                the name of your app
   * @param       {Object}            opts                   optional parameters
   * @param       {Object}            opts.credentials       pre-configured Credentials object from http://github.com/uport-project/uport-js object. Configure this is you need to create signed requests
   * @param       {Function}          opts.signer            signing function which will be used to sign JWT's in the credentials object
   * @param       {String}            opts.clientId          a uport id for your application this will be used in the default credentials object
   * @param       {String}            opts.rpcUrl            a JSON rpc url (defaults to https://ropsten.infura.io)
   * @param       {String}            opts.infuraApiKey      Infura API Key (register here http://infura.io/register.html)
   * @param       {Function}          opts.topicFactory      A function creating a topic
   * @param       {Function}          opts.uriHandler        Function to present QR code or other UX to approve request
   * @param       {Function}          opts.mobileUriHandler  Function to request in mobile browsers
   * @param       {Function}          opts.closeUriHandler   Function to hide UX created with uriHandler after request is done
   * @return      {Object}            self
   */

  //  TODO do we need registry settings
  constructor (appName, opts = {}) {
    this.appName = appName || 'uport-connect-app'
    this.infuraApiKey = opts.infuraApiKey || this.appName.replace(/\W+/g, '-')
    this.clientId = opts.clientId

    this.rpcUrl = opts.rpcUrl || (INFURA_ROPSTEN + '/' + this.infuraApiKey)
    this.provider = opts.provider
    this.isOnMobile = opts.isMobile || isMobile()
    this.topicFactory = opts.topicFactory || TopicFactory(this.isOnMobile)
    this.uriHandler = opts.uriHandler
    this.mobileUriHandler = opts.mobileUriHandler
    this.closeUriHandler = opts.closeUriHandler
    this.credentials = opts.credentials || new Credentials({address: opts.clientId, signer: opts.signer})
    this.canSign = !!this.credentials.settings.signer && !!this.credentials.settings.address
  }

  getProvider () {
    return new UportSubprovider({
      requestAddress: this.requestAddress.bind(this),
      sendTransaction: this.sendTransaction.bind(this),
      provider: this.provider || new HttpProvider(this.rpcUrl)
    })
  }

  requestCredentials (request = {}, uriHandler = this.uriHandler) {
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
        if (request.notifications) {
          return reject(new Error('Notifications rights can not currently be requested without a signer configured'))
        }
        resolve(paramsToUri(this.addAppParameters({ to: 'me' }, topic.url)))
      }
    }).then(uri => this.request({uri, topic, uriHandler})).then(jwt => receive(jwt, topic.url))
  }

  requestAddress (uriHandler = this.uriHandler) {
    return this.requestCredentials({}, uriHandler).then((profile) => profile.address)
  }

  attestCredentials ({sub, claim, exp}, uriHandler = this.uriHandler) {
    const self = this
    return this.credentials.attest({ sub, claim, exp }).then(jwt => {
      const uri = `me.uport:add?attestations=${encodeURIComponent(jwt)}`
      //  Your uriHandler does not need a cancel function here, cancel is for canceling a request, passes default closeQR if using qr defaults.
      const cancel = this.closeUriHandler || function(){}
      self.isOnMobile ? self.mobileUriHandler(uri) : uriHandler(uri, cancel)
      return true
    })
  }

  request ({uri, topic, uriHandler = this.uriHandler}) {
    (this.isOnMobile && this.mobileUriHandler)
      ? this.mobileUriHandler(uri)
      : uriHandler(uri, topic.cancel)

    if (this.closeUriHandler) {
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

  // TODO support contract.new (maybe?)
  contract (abi, uriHandler = this.uriHandler) {
    const self = this
    const txObjectHandler = (methodTxObject) => self.txObjectHandler(methodTxObject, uriHandler)
    return new ContractFactory(txObjectHandler)(abi)
  }

  sendTransaction (txobj, uriHandler = this.uriHandler) {
    return this.txObjectHandler(txobj, uriHandler)
  }

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
    return appTxObject
  }

  txObjectHandler (methodTxObject, uriHandler = this.uriHandler) {
    const topic = this.topicFactory('tx')
    let uri = paramsToUri(this.addAppParameters(methodTxObject, topic.url))
    return this.request({uri, topic, uriHandler})
  }
}

const paramsToUri = (params) => {
  if (!params.to) {
    throw new Error('Contract creation is not supported by uportProvider')
  }
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
  ['label', 'callback_url', 'client_id'].map(param => {
    if (params[param]) {
      pairs.push([param, params[param]])
    }
  })
  return `${uri}?${pairs.map(kv => `${kv[0]}=${encodeURIComponent(kv[1])}`).join('&')}`
}

export default Connect

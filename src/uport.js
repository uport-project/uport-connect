import TopicFactory from './topicFactory'
// import UportJs from 'uport'
// import UportLite from 'uport-lite'
import MobileDetect from 'mobile-detect'
import ContractFactory from './contract'
import UportWeb3 from './uportWeb3'
import { QRUtil } from './util/qrdisplay'
// TODO Only our default now (maybe), not customizable, or minimally

import { decodeToken } from 'jsontokens'

// these are consensysnet constants, replace with mainnet before release!
const INFURA_ROPSTEN = 'https://ropsten.infura.io'

// TODO Add simple QR wrapper for the orginal default flow, just means wrapping open/close functionality
// TODO add cancel back in, should be really simple now
// TODO extend this uport to uport with web3 so we can eventually have sepearte distributions.

function mobileShowHandler (uri) {
  window.location.assign(uri)
}

function isMobile () {
  if (typeof navigator !== 'undefined') {
    return !!(new MobileDetect(navigator.userAgent).mobile())
  } else return false
}
/**
 * This class is the main entry point for interaction with uport.
 */
class Uport {

  /**
   * Creates a new uport object.
   *
   * @memberof    Uport
   * @method      constructor
   * @param       {String}            dappName                the name of your dapp
   * @param       {Object}            opts                    optional parameters
   * @param       {String}            opts.rpcUrl             a JSON rpc url (defaults to https://ropsten.infura.io)
   * @param       {String}            opts.infuraApiKey       Infura API Key (register here http://infura.io/register.html)
   * @param       {Function}          opts.topicFactory       A function creating a topic
   * @param       {Function}          opts.showHandler        Function to present QR code or other UX to approve request
   * @param       {Function}          opts.mobileShowHandler  Function to request in mobile browsers
   * @param       {Function}          opts.closeHandler       Function to hide UX created with showHandler after request is done
   * @return      {Object}            self
   */

  //  TODO do we need registry settings
  constructor (dappName, opts = {}) {
    this.dappName = dappName || 'uport-connect-app'
    this.infuraApiKey = opts.infuraApiKey || this.dappName.replace(/\W/g, '')

    this.rpcUrl = opts.rpcUrl || (INFURA_ROPSTEN + '/' + this.infuraApiKey)    
    this.isOnMobile = opts.isMobile || isMobile()
    this.topicFactory = opts.topicFactory || TopicFactory(this.isOnMobile)
    this.showHandler = opts.showHandler || QRUtil.openQr
    this.mobileShowHandler = opts.mobileShowHandler || mobileShowHandler
    this.closeHandler = opts.closeHandler || QRUtil.closeQr

    // Bundle the registry stuff, right now it uses web3, so sort of  circ reference here, but will be removed
    // registrySettings.web3prov = this.provider
    // this.registry = UportLite({rpcUrl: this.rpcUrl, registryAddress: registrySettings.registryAddress})
    // this.backend = new UportJs.default.Uport({registry: this.registry})
  }

  getWeb3 () {
    return UportWeb3({
      connect: this.connect.bind(this),
      sendTransaction: this.sendTransaction.bind(this),
      rpcUrl: this.rpcUrl
    })
  }

  connect (showHandler = null) {
    const topic = this.topicFactory('access_token')
    const uri = 'me.uport:me?callback_url=' + encodeURIComponent(topic.url)

    return this.request({uri, topic, showHandler})
                  .then((token) => {
                    // TODO add token verification
                    let decoded = decodeToken(token)
                    let address = decoded.payload.iss
                    return address
                  })
  }

  request ({uri, topic, showHandler}) {
    this.isOnMobile
      ? this.mobileShowHandler(uri)
      : (showHandler || this.showHandler)(uri)
    if (this.closeHandler) {
      return new Promise((resolve, reject) => {
        topic.then(res => {
          this.closeHandler()
          resolve(res)
        }, error => {
          this.closeHandler()
          reject(error)
        })
      })
    } else return topic
  }

  // TODO support contract.new (maybe?)
  contract (abi) {
    return new ContractFactory(abi, this.txObjectHandler.bind(this))
  }

  sendTransaction (txobj, showHandler = null) {
    return this.txObjectHandler(txobj, showHandler)
  }

  txObjectHandler (methodTxObject, showHandler = null) {
    let uri = txParamsToUri(methodTxObject)
    const topic = this.topicFactory('tx')
    uri += '&callback_url=' + encodeURIComponent(topic.url)

    return this.request({uri, topic, showHandler})
  }
}

const txParamsToUri = (txParams) => {
  if (!txParams.to) {
    throw new Error('Contract creation is not supported by uportProvider')
  }
  let uri = `me.uport:${txParams.to}`
  const params = []
  if (txParams.value) {
    params.push(['value', parseInt(txParams.value, 16)])
  }
  if (txParams.data) {
    params.push(['bytecode', txParams.data])
  }
  if (txParams.function) {
    params.push(['function', txParams.function])
  }
  if (txParams.gas) {
    params.push(['gas', parseInt(txParams.gas, 16)])
  }
  return `${uri}?${params.map(kv => `${kv[0]}=${encodeURIComponent(kv[1])}`).join('&')}`
}

export { Uport }

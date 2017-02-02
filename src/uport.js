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
   * @return      {Object}            self
   */

  //  TODO do we need registry settings
  constructor (dappName, opts = {}) {
    this.dappName = dappName || 'uport-connect-app'
    this.infuraApiKey = opts.infuraApiKey || this.dappName.replace(/\W/g, '')

    this.rpcUrl = opts.rpcUrl || (INFURA_ROPSTEN + '/' + this.infuraApiKey)    
    this.isOnMobile = isMobile()
    this.topicFactory = opts.topicFactory || TopicFactory(this.isOnMobile)
    this.showHandler = opts.showHandler || QRUtil.openQr
    this.closeHandler = QRUtil.closeQr

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
    const uri = 'me.uport:me?callback_url=' + topic.url

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
      ? mobileShowHandler(uri)
      : (showHandler || this.showHandler)(uri)
    return topic
  }

  // TODO support contract.new (maybe?)
  contract (abi, showHandler = null) {
    return new ContractFactory(abi, this.txObjectHandler(showHandler))
  }

  sendTransaction (txobj, showHandler = null) {
    return this.txObjectHandler(showHandler)(txobj)
  }

  txObjectHandler (showHandler = null) {
    const self = this
    return (methodTxObject) => {
      let uri = txParamsToUri(methodTxObject)
      const topic = self.topicFactory('tx')
      uri += '&callback_url=' + topic.url

      return self.request({uri, topic, showHandler})
    }
  }
}

// TODO clean this up
const txParamsToUri = (txParams) => {
  let uri = 'me.uport:' + txParams.to
  let symbol
  if (!txParams.to) {
    throw new Error('Contract creation is not supported by uportProvider')
  }
  if (txParams.value) {
    uri += '?value=' + parseInt(txParams.value, 16)
  }
  if (txParams.data) {
    symbol = txParams.value ? '&' : '?'
    const hexRE = /[0-9A-Fa-f]{6}/g
    if (hexRE.test(txParams.data)) {
      uri += `${symbol}bytecode=${txParams.data}`
    } else {
      uri += `${symbol}function=${txParams.data}`
    }
  }
  if (txParams.gas) {
    symbol = txParams.value || txParams.data ? '&' : '?'
    uri += symbol + 'gas=' + parseInt(txParams.gas, 16)
  }
  return uri
}

export { Uport }

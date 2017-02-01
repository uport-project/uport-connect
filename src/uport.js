import MsgServer from './msgServer'
// import UportJs from 'uport'
// import UportLite from 'uport-lite'
import MobileDetect from 'mobile-detect'
import ContractFactory from './contract'
import UportWeb3 from './uportWeb3'

// TODO Only our default now (maybe), not customizable, or minimally

import { decodeToken } from 'jsontokens'

const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'
// these are consensysnet constants, replace with mainnet before release!
const INFURA_ROPSTEN = 'https://ropsten.infura.io'
const UPORT_REGISTRY_ADDRESS = '0xb9C1598e24650437a3055F7f66AC1820c419a679'

// TODO Add simple QR wrapper for the orginal default flow, just means wrapping open/close functionality
// TODO add cancel back in, should be really simple now
// TODO extend this uport to uport with web3 so we can eventually have sepearte distributions.

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
   * @param       {String}            opts.registryAddress    the address of an uport-registry
   * @param       {Object}            opts.ipfsProvider       an ipfsProvider (defaults to infura)
   * @param       {String}            opts.rpcUrl             a JSON rpc url (defaults to https://ropsten.infura.io)
   * @param       {String}            opts.infuraApiKey       Infura API Key (register here http://infura.io/register.html)
   * @param       {String}            opts.chasquiUrl         a custom chasqui url
   * @return      {Object}            self
   */

  //  TODO do we need registry settings
  constructor (dappName, opts = {}) {
    this.dappName = dappName || 'uport-connect-app'
    this.infuraApiKey = opts.infuraApiKey || this.dappName.replace(/\W/g, '')

    const registrySettings = {}
    registrySettings.registryAddress = opts.registryAddress || UPORT_REGISTRY_ADDRESS
    if (opts.ipfsProvider) {
      registrySettings.ipfs = opts.ipfsProvider
    }
    this.rpcUrl = opts.rpcUrl || (INFURA_ROPSTEN + '/' + this.infuraApiKey)
    const md = new MobileDetect(navigator.userAgent)
    this.isOnMobile = (md.mobile() !== null)
    const chasquiUrl = opts.chasquiUrl || CHASQUI_URL
    this.msgServer = opts.msgServer || new MsgServer(chasquiUrl, this.isOnMobile)

    // Bundle the registry stuff, right now it uses web3, so sort of  circ reference here, but will be removed
    // registrySettings.web3prov = this.provider
    // this.registry = UportLite({rpcUrl: this.rpcUrl, registryAddress: registrySettings.registryAddress})
    // this.backend = new UportJs.default.Uport({registry: this.registry})
  }

  // optional qr display arg
  getWeb3 (qrDisplay) {
    const opts = {
      infuraApiKey: this.infuraApiKey,
      qrdisplay: qrDisplay,
      rpcUrl: this.rpcUrl,
      chasquiUrl: this.chasquiUrl,
      connect: this.connect.bind(this)
    }
    return UportWeb3(this.dappName, opts)
  }

  connect (showHandler) {
    // TODO do we need this

    const topic = this.msgServer.newTopic('access_token')
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
    // TODO need self reference
    showHandler(uri)
    // wrapping msg server func in promise
    return topic
  }

  // TODO support contract.new (maybe?)
  contract(abi) {
    return new ContractFactory(abi, this.txObjectHandler.bind(this))
  }

  sendTransaction(txobj, showHandler) {
    return this.txObjectHandler(txobj, showHandler)
  }

  txObjectHandler(methodTxObject, showHandler) {
      let uri = txParamsToUri(methodTxObject)
      const topic = this.msgServer.newTopic('tx')
      uri += '&callback_url=' + topic.url

      return this.request({uri, topic, showHandler})
  }
}

const txParamsToUri = (txParams) => {
  let uri = 'me.uport:' + txParams.to
  let symbol
  if (!txParams.to) {
      return cb(new Error('Contract creation is not supported by uportProvider'))
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

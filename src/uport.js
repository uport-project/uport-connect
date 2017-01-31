import MsgServer from './msgServer'
import { Registry } from 'uport-persona'
import MobileDetect from 'mobile-detect'
import ContractFactory from './contract'
import UportWeb3 from './uportWeb3'


//TODO Only our default now (maybe), not customizable, or minimally

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
    this.dappName = dappName || 'uport-lib-app'
    this.infuraApiKey = opts.infuraApiKey || this.dappName.replace(/\W/g,'')

    const registrySettings = {}
    registrySettings.registryAddress = opts.registryAddress || UPORT_REGISTRY_ADDRESS
    if (opts.ipfsProvider) {
      registrySettings.ipfs = opts.ipfsProvider
    }
    this.rpcUrl = opts.rpcUrl || (INFURA_ROPSTEN + '/' + this.infuraApiKey)
    const md = new MobileDetect(navigator.userAgent)
    this.isOnMobile = (md.mobile() !== null)
    const chasquiUrl = opts.chasquiUrl || CHASQUI_URL
    this.msgServer = new MsgServer(chasquiUrl, this.isOnMobile)

    // Bundle the registry stuff, right now it uses web3, so sort of  circ reference here, but will be removed
    // registrySettings.web3prov = this.provider
    this.registry = new Registry(registrySettings)
  }

  // optional qr display arg
  getWeb3(qrDisplay) {
    const opts = {
      infuraApiKey:this.infuraApiKey,
      qrdisplay: qrDisplay,
      rpcUrl: this.rpcUrl,
      chasquiUrl: this.chasquiUrl
    }
    return UportWeb3(this.dappName, opts)
  }

  /**
   * This method returns an instance of profile of the current uport user.
   *
   * @memberof    Uport
   * @method      getUserPersona
   * @return      {Promise<Object>}    an object containing the public profile for the user
   */
   // returns a response object with qr data, generate image func, and promise listener
  //  maybe you should have to pass an object her
  getUserPersona () {
    // TODO now this has to return a response object
    return new Promise((resolve, reject) => {
      self.getAddress().listen()
        .then(self.registry.getPersona)
        .then(resolve)
        .catch(reject)
    })
  }
  // TODO maybe just get the persona with connect?

  //  TODO maybe check if connected ?
  connect() {

    const self = this

    let topic = self.msgServer.newTopic('access_token')
    let ethUri = 'me.uport:me?callback_url=' + topic.url

    const listener = new Promise((resolve, reject) => {
        self.msgServer.waitForResult(topic, (err, token) => {
          if (err) reject(err)
          let decoded = decodeToken(token)
          let address = decoded.payload.iss
          resolve(address)
        })
    })

    return { "uri": ethUri, "listen": listener }
  }

  // get address() {
  //  rename
  //   return this.address
  // }

  // TODO support contract.new (maybe?)
  contract(abi) {
    return new ContractFactory(abi, contractFunctionExtend(this.msgServer))
  }

  sendTransaction(txobj) {

    // to txm param
    // message server
    // return uri
    //  & return promise

    }

  }

const contractFunctionExtend = (msgServer) => (methodTxObject) => {
  let ethUri = txParamsToUri(methodTxObject)
  const topic = msgServer.newTopic('tx')
  ethUri += '&callback_url=' + topic.url

  const listener = new Promise((resolve, reject) => {
    msgServer.waitForResult(topic, (err, txHash) => {
      if (err) { reject(err) }
      resolve(txHash)
    })
  })

  return {"uri": ethUri, "listen": listener  }
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
      const hexRE = /[0-9A-Fa-f]{6}/g;
      if(hexRE.test(txParams.data)) {
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

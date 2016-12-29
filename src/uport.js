import UportSubprovider from './uportsubprovider'
import MsgServer from './msgServer'
import { Registry } from 'uport-persona'
import isMobile from 'is-mobile'
import Web3 from 'web3'
import ProviderEngine from 'web3-provider-engine'
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc'

import QRDisplay from '../utils/qrdisplay'

const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'
// these are consensysnet constants, replace with mainnet before release!
const INFURA_ROPSTEN = 'https://ropsten.infura.io'
const UPORT_REGISTRY_ADDRESS = '0xb9C1598e24650437a3055F7f66AC1820c419a679'

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
   * @param       {Object}            opts.qrDisplay          custom QR-code displaying
   * @param       {String}            opts.registryAddress    the address of an uport-registry
   * @param       {Object}            opts.ipfsProvider       an ipfsProvider (defaults to infura)
   * @param       {String}            opts.rpcUrl             a JSON rpc url (defaults to https://ropsten.infura.io)
   * @param       {String}            opts.infuraApiKey       Infura API Key (register here http://infura.io/register.html)
   * @param       {String}            opts.chasquiUrl         a custom chasqui url
   * @return      {Object}            self
   */
  constructor (dappName, opts = {}) {
    this.dappName = dappName || 'uport-lib-app'
    this.infuraApiKey = opts.infuraApiKey || this.dappName.replace(/\W/g,'')
    this.qrdisplay = opts.qrDisplay || new QRDisplay()
    const registrySettings = {}
    registrySettings.registryAddress = opts.registryAddress || UPORT_REGISTRY_ADDRESS
    if (opts.ipfsProvider) {
      registrySettings.ipfs = opts.ipfsProvider
    }
    this.rpcUrl = opts.rpcUrl || (INFURA_ROPSTEN + '/' + this.infuraApiKey)
    this.isOnMobile = isMobile(navigator.userAgent)
    const chasquiUrl = opts.chasquiUrl || CHASQUI_URL
    this.msgServer = new MsgServer(chasquiUrl, this.isOnMobile)
    this.subprovider = this.createUportSubprovider()
    this.provider = this.createUportProvider()
    registrySettings.web3 = this.provider
    this.registry = new Registry(registrySettings)
  }


  /**
   * Get the uport flavored web3 provider. It's implemented using provider engine.
   *
   * @memberof    Uport
   * @method      getUportProvider
   * @return      {Object}            the uport web3 provider
   */
  getUportProvider () {
    return this.provider
  }

  /**
   * Return a fully baked web3 object containing the uport web3 provider
   *
   * @memberof    Uport
   * @method      getWeb3
   * @return      {Object}            the uport enabled web3 object
   */
  getWeb3 () {
    const web3 = new Web3()
    web3.setProvider(this.provider)
    return web3
  }

  createUportProvider () {
    this.web3Provider = new ProviderEngine()
    this.web3Provider.addProvider(this.subprovider)

    // data source
    var rpcSubprovider = new RpcSubprovider({
      rpcUrl: this.rpcUrl
    })
    this.web3Provider.addProvider(rpcSubprovider)

    // start polling
    this.web3Provider.start()
    this.web3Provider.stop()
    return this.web3Provider
  }

  /**
   * Get the subprovider that handles signing transactions using uport. Use this if you want to customize your provider engine instance.
   *
   * @memberof    Uport
   * @method      getUportProvider
   * @return      {Object}            the uport subprovider
   */
  getUportSubprovider () {
    return this.subprovider
  }

  createUportSubprovider (chasquiUrl) {
    const self = this
    var opts = {
      msgServer: self.msgServer,
      uportConnectHandler: self.handleURI.bind(self),
      ethUriHandler: self.handleURI.bind(self),
      closeQR: self.qrdisplay.closeQr.bind(self.qrdisplay)
    }
    return new UportSubprovider(opts)
  }

  handleURI (uri) {
    const self = this
    uri += '&label=' + encodeURI(self.dappName)
    if (self.isOnMobile) {
      window.location.assign(uri)
    } else {
      self.qrdisplay.openQr(uri)
    }
  }
  /**
   * This method returns an instance of profile of the current uport user.
   *
   * @memberof    Uport
   * @method      getUserPersona
   * @return      {Promise<Object>}    an object containing the public profile for the user
   */
  getUserPersona () {
    const self = this
    return new Promise((resolve, reject) => {
      self.subprovider.getAddress((err, address) => {
        if (err) { reject(err) }
        self.registry.getPersona(address).then(resolve).catch(reject)
      })
    })
  }
}

export default Uport

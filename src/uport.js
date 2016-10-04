import UportSubprovider from './uportsubprovider'
import MsgServer from './msgServer'
import { MutablePersona } from 'uport-persona'
import isMobile from 'is-mobile'
import ProviderEngine from 'web3-provider-engine'
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc'

import QRDisplay from '../utils/qrdisplay'

const CHASQUI_URL = 'https://chasqui.uport.me/'
// these are consensysnet constants, replace with mainnet before release!
const INFURA_CONSENSYSNET = 'https://consensysnet.infura.io:8545'
const UPORT_REGISTRY_ADDRESS = '0xa9be82e93628abaac5ab557a9b3b02f711c0151c'

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
   * @param       {Object}            opts.ipfsProvider       an ipfsProvider
   * @param       {String}            opts.chasquiUrl         a custom chasqui url
   * @return      {Object}            self
   */
  constructor (dappName, opts) {
    this.dappName = dappName
    this.qrdisplay = opts.qrDisplay || new QRDisplay()
    this.uportRegistryAddress = opts.registryAddress || UPORT_REGISTRY_ADDRESS
    this.ipfsProvider = opts.ipfsProvider
    this.isOnMobile = isMobile(navigator.userAgent)
    const chasquiUrl = opts.chasquiUrl || CHASQUI_URL
    this.msgServer = new MsgServer(chasquiUrl, this.isOnMobile)
    this.subprovider = this.createUportSubprovider()
  }

  /**
   * Get the uport flavored web3 provider. It's implemented using provider engine.
   *
   * @memberof    Uport
   * @method      getUportProvider
   * @param       {String}            rpcUrl                  the rpc client to use
   * @return      {Object}            the uport web3 provider
   */
  getUportProvider (rpcUrl) {
    this.web3Provider = new ProviderEngine()
    this.web3Provider.addProvider(this.subprovider)

    // data source
    var rpcSubprovider = new RpcSubprovider({
      rpcUrl: rpcUrl || INFURA_CONSENSYSNET
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
   * A method for setting providers if not done previously. This is useful if you are using a custom provider engine for example.
   * Not that the ipfsProvider can also be set in the constructor.
   *
   * @memberof    Uport
   * @method      setProviders
   * @param       {Object}            web3Provider            the web3 provider to use (optional)
   * @param       {Object}            ipfsProvider            the ipfs provider to use (optional)
   */
  setProviders (web3Provider, ipfsProvider) {
    if (ipfsProvider) {
      if (this.ipfsProvider) {
        throw new Error('ipfs provider already set.')
      } else {
        this.ipfsProvider = ipfsProvider
      }
    }
    if (web3Provider) {
      if (this.web3Provider) {
        throw new Error('Web3 provider already set.')
      } else {
        this.web3Provider = web3Provider
      }
    }
  }

  /**
   * This method returns an instance of MutablePersona of the current uport user.
   *
   * @memberof    Uport
   * @method      getUserPersona
   * @return      {Promise<MutablePersona>}    a MutablePersona instantiated with the address of the connected uport user
   */
  getUserPersona () {
    const self = this
    if (!self.ipfsProvider) throw new Error('ipfs not set')
    if (!self.web3Provider) throw new Error('web3Provider not set')
    return new Promise((resolve, reject) => {
      self.subprovider.getAddress((err, address) => {
        if (err) { reject(err) }
        let persona = new MutablePersona(address, self.ipfsProvider, self.web3Provider, self.uportRegistryAddress)
        persona.load().then(() => { resolve(persona) })
      })
    })
  }
}

export default Uport

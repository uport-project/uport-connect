import UportSubprovider from './uportsubprovider'
import MsgServer from './msgServer'
import { Registry } from 'uport-persona'
import MobileDetect from 'mobile-detect'
import Web3 from 'web3'
import ProviderEngine from 'web3-provider-engine'
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc'

//TODO Only our default now (maybe), not customizable, or minimally
import QRDisplay from './util/qrdisplay'

import { decodeToken } from 'jsontokens'

const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'
// these are consensysnet constants, replace with mainnet before release!
const INFURA_ROPSTEN = 'https://ropsten.infura.io'
const UPORT_REGISTRY_ADDRESS = '0xb9C1598e24650437a3055F7f66AC1820c419a679'


// TODO three ui levels, return URIs, return QR images, orginal inject QR
// TODO add cancel back in

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
  //  * @param       {Object}            opts.qrDisplay          custom QR-code displaying
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

    //
    this.subprovider = this.createUportSubprovider()
    this.provider = this.createUportProvider()
    registrySettings.web3prov = this.provider
    this.registry = new Registry(registrySettings)

    this.registry = new Registry()
  }

  // /**
  //  * Return a fully baked web3 object containing the uport web3 provider
  //  *
  //  * @memberof    Uport
  //  * @method      getWeb3
  //  * @return      {Object}            the uport enabled web3 object
  //  */
  // TODO Internal now, remove when web3 removed,
  getWeb3 () {
    const web3 = new Web3()
    web3.setProvider(this.provider)
    // Work around to issue with web3 requiring a from parameter. This isn't actually used.
    web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'
    return web3
  }

  // TODO Internal now, remove when web3 removed
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

  // /**
  //  * Get the subprovider that handles signing transactions using uport. Use this if you want to customize your provider engine instance.
  //  *
  //  * @memberof    Uport
  //  * @method      getUportProvider
  //  * @return      {Object}            the uport subprovider
  //  */
  // getUportSubprovider () {
  //   return this.subprovider
  // }

  createUportSubprovider (chasquiUrl) {
    // TODO make sure we have the address available
    // TODO remove self reference
    const self = this
    console.log('the address')
    console.log(self.address)
    var opts = {
      msgServer: self.msgServer,
    }
    return new UportSubprovider(opts)
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

    // return new Promise((resolve, reject) => {
    //   self.subprovider.getAddress((err, address) => {
    //     if (err) { reject(err) }
    //     self.registry.getPersona(address).then(resolve).catch(reject)
    //   })
    // })
  }

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
          self.provider.address = address
          resolve(address)
        })
    })

    return { "uri": ethUri, "listen": listener }
  }

  // get address() {
  //  rename
  //   return this.address
  // }

  // TODO
  // completely hides web3 functionality to be removed in future
  // next step: wrap the rest of the contract functionality
  // last step: remove web3, we simpley need to map txn obj to a uri, and maybe allow web3 users and easy to pass in stuff. or others libs, be agnostic
  // methods call require a callback still unfornately, if still decide to use web3 we will need a subprovider and to over write
  contract(abi) {
    // return web3 contract object
    const web3 = this.getWeb3()
    return web3.eth.contract(abi)
  }

  // sendTransaction(txobj) {
  //   // TODO remove redundant ref
  //   const web3 = this.getWeb3()
  //   // TODO not really sync ^, hacky
  //   web3.eth.sendTransaction(txobj, (err, res) => {
  //     // TODO error
  //
  //   })
  // }
}

// TODO export qr stuff differently

const qrdisplay = new QRDisplay()

const openQR = (data) => {
  qrdisplay.openQr(data)
}

const closeQR = () => {
  qrdisplay.closeQr()
}

export {Uport, openQR, closeQR}

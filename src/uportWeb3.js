import MsgServer from './msgServer'
import { Registry } from 'uport-persona'
import MobileDetect from 'mobile-detect'
import Web3 from 'web3'
import ProviderEngine from 'web3-provider-engine'
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc'
import UportSubprovider from './uportSubprovider'

import QRDisplay from './util/qrdisplay'

const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'
// these are consensysnet constants, replace with mainnet before release!
const INFURA_ROPSTEN = 'https://ropsten.infura.io'
const UPORT_REGISTRY_ADDRESS = '0xb9C1598e24650437a3055F7f66AC1820c419a679'

const handleURI = (isOnMobile) => (qrdisplay) => (uri) => {
  uri += '&label=' + encodeURI("myuport")

  if (isOnMobile) {
    window.location.assign(uri)
  } else {
    qrdisplay.openQr(uri)
  }
}

const createUportProvider = (rpcUrl, subprovider) => {
  const web3Provider = new ProviderEngine()
  web3Provider.addProvider(subprovider)

  // data source
  const rpcSubprovider = new RpcSubprovider({
    rpcUrl: rpcUrl
  })
  web3Provider.addProvider(rpcSubprovider)

  // start polling
  web3Provider.start()
  web3Provider.stop()
  return web3Provider
}

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
const UportWeb3 = (dappNameArg, opts = {}) => {
    const dappName = dappNameArg || 'uport-lib-app'
    const infuraApiKey = opts.infuraApiKey || dappName.replace(/\W/g,'')
    const qrdisplay = opts.qrDisplay || new QRDisplay()
    const rpcUrl = opts.rpcUrl || (INFURA_ROPSTEN + '/' + infuraApiKey)
    const md = new MobileDetect(navigator.userAgent)
    const isOnMobile = (md.mobile() !== null)
    const chasquiUrl = opts.chasquiUrl || CHASQUI_URL
    const msgServer = new MsgServer(chasquiUrl, isOnMobile)


    const subProviderOpts = {
      msgServer: msgServer,
      uportConnectHandler: handleURI(isOnMobile)(qrdisplay),
      ethUriHandler: handleURI(isOnMobile)(qrdisplay),
      closeQR: qrdisplay.closeQr.bind(qrdisplay),
      isQRCancelled: qrdisplay.isQRCancelled.bind(qrdisplay),
      resetQRCancellation: qrdisplay.resetQRCancellation.bind(qrdisplay)
    }

    const subprovider = new UportSubprovider(subProviderOpts)
    const provider = createUportProvider(rpcUrl, subprovider)

    const web3 = new Web3()
    web3.setProvider(provider)
    // Work around to issue with web3 requiring a from parameter. This isn't actually used.
    web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'

    return web3
  }


export default UportWeb3

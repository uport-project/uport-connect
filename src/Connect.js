import ConnectCore from './ConnectCore'
import Web3 from 'web3'
import { openQr, closeQr } from './util/qrdisplay'

/**
*  Primary object for frontend interactions with uPort. Bundles all neccesary functionality.
*  @extends ConnectCore
*
*/
class Connect extends ConnectCore {

  /**
   * Instantiates a new uPort connect object.
   *
   * @example
   * import { Connect } from 'uport-connect'
   * const uPort = new Connect('Mydapp')
   * @param       {String}            appName                the name of your app
   * @param       {Object}            [opts]                 optional parameters
   * @param       {Object}            opts.credentials       pre-configured Credentials object from http://github.com/uport-project/uport-js object. Configure this if you need to create signed requests
   * @param       {Function}          opts.signer            signing function which will be used to sign JWT's in the credentials object
   * @param       {String}            opts.clientId          uport identifier for your application this will be used in the default credentials object
   * @param       {Object}            [opts.network='kovan'] network config object or string name, ie. { id: '0x1', registry: '0xab5c8051b9a1df1aab0149f8b0630848b7ecabf6', rpcUrl: 'https://mainnet.infura.io' } or 'kovan', 'mainnet', 'ropsten'.
   * @param       {String}            opts.rpcUrl            JSON rpc url (defaults to https://ropsten.infura.io)
   * @param       {String}            opts.infuraApiKey      Infura API Key (register here http://infura.io/register.html)
   * @param       {Function}          opts.topicFactory      function which generates topics and deals with requests and response
   * @param       {Function}          opts.uriHandler        default function to consume generated URIs for requests, can be used to display QR codes or other custom UX
   * @param       {Function}          opts.mobileUriHandler  default function to consume generated URIs for requests on mobile
   * @param       {Function}          opts.closeUriHandler   default function called after a request receives a response, can be to close QR codes or other custom UX
   * @return      {Connect}                                  self
   */

  constructor (appName, opts = {}) {
    super(appName, opts)
    this.uriHandler = opts.uriHandler || openQr
    this.mobileUriHandler = opts.mobileUriHandler || mobileUriHandler
    this.closeUriHandler = opts.closeUriHandler || (this.uriHandler === openQr ? closeQr : undefined)
  }

 /**
  *  Instantiates and returns a web3 object wrapped with uPort functionality. For
  *  more details see uportSubprovider and getProvider in connectCore.
  *
  *  @return          {web3}    A uPort web3 object
  */
  getWeb3 () {
    const provider = this.getProvider()
    const web3 = new Web3()
    web3.setProvider(provider)
    // Work around to issue with web3 requiring a from parameter. This isn't actually used.
    web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'
    return web3
  }
}

// TODO may want to make mobileUriHandler available for ConnectCore.
/**
 *  Consumes a URI. Used by default when called on a mobile device. Assigns the window
 *  to the URI which will bring up a dialog to open the URI in the uPort app.
 *
 *  @param    {String}     uri    A uPort URI
 *  @private
 */
function mobileUriHandler (uri) {
  window.location.assign(uri)
}

export default Connect

import ConnectCore from './ConnectCore'
import Web3 from 'web3'
import UportSubprovider from './uportSubprovider'
/**
 * This class is the main entry point for interaction with uport.
 */
class Connect extends ConnectCore {

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
    super(appName, opts)
  }

  getWeb3 () {
    const provider = this.getProvider(uport)
    const web3 = new Web3()
    web3.setProvider(provider)
    // Work around to issue with web3 requiring a from parameter. This isn't actually used.
    web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'
    return web3
  }

  getProvider () {
    new UportSubprovider({
      requestAddress: this.requestAddress.bind(this),
      sendTransaction: this.sendTransaction.bind(this),
      provider: this.provider || new Web3.providers.HttpProvider(this.rpcUrl)
    })
  }
}

export default Connect

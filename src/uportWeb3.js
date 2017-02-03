import Web3 from 'web3'
import ProviderEngine from 'web3-provider-engine'
import RpcSubprovider from 'web3-provider-engine/subproviders/rpc'
import UportSubprovider from './uportSubprovider'

const createUportProvider = (uport) => {
  const subprovider = new UportSubprovider(uport)
  const web3Provider = new ProviderEngine()
  web3Provider.addProvider(subprovider)
  // data source
  const rpcSubprovider = new RpcSubprovider({
    rpcUrl: uport.rpcUrl
  })
  web3Provider.addProvider(rpcSubprovider)

  // start polling
  web3Provider.start()
  web3Provider.stop()
  return web3Provider
}

// TODO write new docs here
  /**
   * Creates a new uport enhanced web3 object
   *
   * @param       {Uport}             uport                   primary uport object
   * @return      {Object}            web3                    Web3 instance
   */
const UportWeb3 = (uport) => {
  const provider = createUportProvider(uport)
  const web3 = new Web3()
  web3.setProvider(provider)
  // Work around to issue with web3 requiring a from parameter. This isn't actually used.
  web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'
  return web3
}

// TODO maybe export at top level still

export default UportWeb3

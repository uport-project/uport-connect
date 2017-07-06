import async from 'async'
import { isMNID, decode } from 'mnid'

/**
*  A web3 style provider which can easily be wrapped with uPort functionality.
*  Builds on a base provider. Used in Connect to wrap a provider with uPort specific
*  functionality.
*/
class UportSubprovider {
  /**
   * Instantiates a new wrapped provider
   *
   * @param       {Object}            args                   required arguments
   * @param       {Function}          args.requestAddress    function to get the address of a uPort identity.
   * @param       {Function}          args.sendTransaction   function to handle passing transaction information to a uPort application
   * @param       {Object}            args.provider          a web3 sytle provider
   * @return      {UportSubprovider}                         self
   */
  constructor ({requestAddress, sendTransaction, provider, networkId}) {
    const self = this
    this.provider = provider
    this.networkId = networkId
    this.getAddress = (cb) => {
      if (self.address) return cb(null, self.address)
      requestAddress().then(
        address => {
          const errorMatch = new Error('Address/Account received does not match the network your provider is configured for')
          this.setAccount(address) ? cb(null, self.address) : cb(errorMatch)
        },
      error => cb(error))
    }

    this.sendTransaction = (txobj, cb) => {
      sendTransaction(txobj).then(
        address => cb(null, address),
        error => cb(error)
      )
    }
  }

  setAccount(address) {
    if (this.networkId && isMNID(address)) {
      const mnid = decode(address)
      if (this.networkId === mnid.network) {
        this.address = mnid.address
        return true
      }
      return false
    }
    // Does not force validation, if no network id given will still set address
    this.address = isMNID(address) ? decode(address).address : address
    return true
  }

  /**
   *  Synchronous functionality not supported
   */
  send (payload) {
    throw new Error('Uport Web3 SubProvider does not support synchronous requests.')
  }

  /**
   *  Overrides sendAsync to caputure the following RPC calls eth_coinbase, eth_accounts,
   *  and eth_sendTransaction. All other calls are passed to the based provider.
   *  eth_coinbase, eth_accounts will get a uPort identity address with getAddress.
   *  While eth_sendTransaction with send transactions to a uPort app with sendTransaction
   *
   * @param       {Any}            payload           request payload
   * @param       {Function}       callback          called with response or error
   */
  sendAsync (payload, callback) {
    const self = this
    const respond = (error, result) => {
      if (error) {
        callback({
          id: payload.id,
          jsonrpc: '2.0',
          error: error.message
        })
      } else {
        callback(null, {
          id: payload.id,
          jsonrpc: '2.0',
          result
        })
      }
    }
    if (Array.isArray(payload)) {
      async.map(payload, self.sendAsync.bind(self), callback)
      return
    }
    switch (payload.method) {
      // TODO consider removing, not necessary for interaction with uport
      case 'eth_coinbase':
        return self.getAddress(respond)
      case 'eth_accounts':
        return self.getAddress((error, address) => {
          respond(error, [address])
        })
      case 'eth_sendTransaction':
        let txParams = payload.params[0]
        return self.sendTransaction(txParams, (err, tx) => {
          respond(err, tx)
        })
      default:
        self.provider.sendAsync(payload, callback)
    }
  }
}

export default UportSubprovider

import async from 'async'
import { isMNID, decode } from 'mnid'
import HttpProvider from 'ethjs-provider-http'

import { askProvider } from 'uport-transports/lib/transport/ui'

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
   * @return      {UportSubprovider}                         this
   */
  constructor ({requestAddress, sendTransaction, signTypedData, personalSign, provider, network}) {
    if (!provider) {
      // Extend ethjs HTTP provider if none is given
      this.provider = new HttpProvider(network.rpcUrl)
    } else {
      this.provider = provider
      console.warn('Uport functionality may not be entirely compatible with custom providers.')
    }

    // Detect injected provider
    if (hasWeb3()) {
      // Distinguish between metamask injected provider
      // If metamask, user will be prompted to use injected provider
      // Other injected providers (mist, coinbase wallet, etc.) will be used automatically
      if (web3.currentProvider && web3.currentProvider.isMetaMask) {
        this.hasInjectedProvider = true
      } else {
        this.useInjectedProvider = true
      }
    }

    this.network = network
    this.getAddress = (cb) => {
      if (this.address) return cb(null, this.address)
      requestAddress().then(
        address => {
          const errorMatch = new Error('Address/Account received does not match the network your provider is configured for')
          this.setAccount(address) ? cb(null, this.address) : cb(errorMatch)
        },
      error => cb(error))
    }

    this.sendTransaction = (txobj, cb) => {
      sendTransaction(txobj).then(
        address => cb(null, address),
        error => cb(error)
      )
    }

    this.signTypedData = (typedData, cb) => {
      signTypedData(typedData).then(
        payload => cb(null, payload),
        error => cb(error)
      )
    }

    this.personalSign = (data, cb) => {
      personalSign(data).then(
        payload => cb(null, payload),
        error => cb(error)
      )
    }
  }

  setAccount(address) {
    if (this.network.id && isMNID(address)) {
      const mnid = decode(address)
      if (this.network.id === mnid.network) {
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
   * Replace sync send with async send
   * @private
   */
  send (payload, callback) {
    return this.sendAsync(payload, callback)
  }

  /**
   *  Overrides sendAsync to caputure the following RPC calls eth_coinbase, eth_accounts,
   *  and eth_sendTransaction. All other calls are passed to the based provider.
   *  eth_coinbase, eth_accounts will get a uPort identity address with getAddress.
   *  While eth_sendTransaction with send transactions to a uPort app with sendTransaction
   *
   * @param       {Any}            payload           request payload
   * @param       {Function}       callback          called with response or error
   * @private
   */
  async sendAsync (payload, callback) {
    // Present a dialog to ask about using injected provider if present but not approved
    if (this.hasInjectedProvider && !this.useInjectedProvider) {
      this.useInjectedProvider = await askProvider()
    } 
    // Use injected provider if present and approved
    if (this.useInjectedProvider) {
      web3.provider.sendAsync(payload, callback)
      return
    }

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
      async.map(payload, this.sendAsync.bind(this), callback)
      return
    }
    switch (payload.method) {
      // TODO consider removing, not necessary for interaction with uport
      case 'eth_coinbase':
        return this.getAddress(respond)
      case 'eth_accounts':
        return this.getAddress((error, address) => {
          respond(error, [address])
        })
      case 'eth_sendTransaction':
        let txParams = payload.params[0]
        return this.sendTransaction(txParams, respond)
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData':
        let typedData = payload.params[0]
        return this.signTypedData(typedData, respond)
      case 'personal_sign':
        let data = payload.params[0]
        return this.personalSign(data, respond)
      default:
        return this.provider.sendAsync(payload, callback)
    }
  }
}

/**
 * Detect whether the current window has an injected web3 instance
 */
function hasWeb3() {
  return (typeof web3 !== 'undefined')
}

export default UportSubprovider

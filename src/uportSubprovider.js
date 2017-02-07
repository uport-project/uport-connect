// handles the following RPC methods:
// eth_coinbase
// eth_accounts
// eth_sendTransaction

// TODO support contract.new
import async from 'async'

export default class UportSubprovider {
  constructor ({requestAddress, sendTransaction, provider}) {
    const self = this
    this.provider = provider
    this.getAddress = (cb) => {
      if (self.address) return cb(null, self.address)
      requestAddress().then(
        address => {
        self.address = address
        cb(null, address)
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

  send (payload) {
    throw new Error('Uport Web3 SubProvider does not support synchronous requests.')
  }
  
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

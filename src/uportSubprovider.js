import Subprovider from 'web3-provider-engine/subproviders/subprovider'

// handles the following RPC methods:
// eth_coinbase
// eth_accounts
// eth_sendTransaction

// TODO support contract.new

export default class UportSubprovider extends Subprovider {
  constructor ({requestAddress, sendTransaction}) {
    super()
    const self = this
    this.getAddress = (cb) => {
      if (self.address) return cb(null, self.address)
      requestAddress().then(address => {
        self.address = address
        cb(null, address)
      }).catch(error => cb(error))
    }

    this.sendTransaction = (txobj, cb) => {
      sendTransaction(txobj).then(address => cb(null, address)).catch(error => cb(error))
    }
  }

  handleRequest (payload, next, end) {
    const self = this

    switch (payload.method) {

      // TODO consider removing, not necessary for interaction with uport
      case 'eth_coinbase':
        self.getAddress(function (err, address) {
          end(err, address)
        })
        return

      // TODO consider removing, not necessary for interaction with uport
      case 'eth_accounts':
        self.getAddress(function (err, address) {
        // the result should be a list of addresses
          end(err, [address])
        })
        return

      case 'eth_sendTransaction':
        let txParams = payload.params[0]

        self.sendTransaction(txParams, (err, tx) => {
          end(err, tx)
        })
        return

      default:
        next()
        return

    }
  }
}

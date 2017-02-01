import Subprovider from 'web3-provider-engine/subproviders/subprovider'
import { decodeToken } from 'jsontokens'

// handles the following RPC methods:
// eth_coinbase
// eth_accounts
// eth_sendTransaction

// TODO support contract.new

export default class UportSubprovider extends Subprovider {
  constructor (opts) {
    super()
    // Chasqui URL (default to standard)
    this.msgServer = opts.msgServer

    // uportConnectHandler deals with displaying the
    // uport connect data as QR code or clickable link
    this.uportConnectHandler = opts.uportConnectHandler

    // ethUriHandler deals with displaying the
    // ethereum URI either as a QR code or
    // clickable link for mobile
    this.ethUriHandler = opts.ethUriHandler

    this.closeQR = opts.closeQR
    this.isQRCancelled = opts.isQRCancelled
    this.resetQRCancellation = opts.resetQRCancellation

    // Set address if present
    this.address = opts.address
    this.getAddress = (cb ) => {
      opts.connect().then(address => cb(null, address)).catch(error=>cb(error))
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

        self.txParamsToUri(txParams, (err, val) => {
            self.signAndReturnTxHash(val, end)
        })

        return

      default:
        next()
        return

    }
  }

  txParamsToUri (txParams, cb) {
    let uri = 'me.uport:' + txParams.to
    let symbol
    if (!txParams.to) {
      return cb(new Error('Contract creation is not supported by uportProvider'))
    }
    if (txParams.value) {
      uri += '?value=' + parseInt(txParams.value, 16)
    }
    if (txParams.data) {
      symbol = txParams.value ? '&' : '?'
      uri += symbol + 'bytecode=' + txParams.data
    }
    if (txParams.gas) {
      symbol = txParams.value || txParams.data ? '&' : '?'
      uri += symbol + 'gas=' + parseInt(txParams.gas, 16)
    }
    cb(null, uri)
  }

  signAndReturnTxHash (ethUri, cb) {
    const self = this

    let topic = self.msgServer.newTopic('tx')
    ethUri += '&callback_url=' + topic.url
    self.ethUriHandler(ethUri)
    topic.then(txHash => {
      self.closeQr()
      cb(null, txHas)
    }).catch(err => {
      self.closeQr()
      cb(err)      
    })
  }

}

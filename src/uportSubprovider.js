import Subprovider from 'web3-provider-engine/subproviders/subprovider'
import { decodeToken } from 'jsontokens'

// handles the following RPC methods:
// eth_coinbase
// eth_accounts
// eth_sendTransaction

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
  }

  handleRequest (payload, next, end) {
    const self = this

    switch (payload.method) {

      case 'eth_coinbase':
        self.getAddress(function (err, address) {
          end(err, address)
        })
        return

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
    // let cancelHandler = {isCancelled: self.isQRCancelled,
    //                      resetCancellation: self.resetQRCancellation}
    // self.msgServer.waitForResult(topic, cancelHandler, function (err, txHash) {
    self.msgServer.waitForResult(topic, function (err, txHash) {
      self.closeQR()
      cb(err, txHash)
    })
  }

  getAddress (cb) {
    const self = this

    if (self.address) {
      cb(null, self.address)
    } else {
      let topic = self.msgServer.newTopic('access_token')
      let ethUri = 'me.uport:me?callback_url=' + topic.url
      self.uportConnectHandler(ethUri)
      // let cancelHandler = {isCancelled: self.isQRCancelled,
      //                      resetCancellation: self.resetQRCancellation}
      // self.msgServer.waitForResult(topic, cancelHandler, function (err, token) {
      self.msgServer.waitForResult(topic, function (err, token) {
        self.closeQR()
        if (err) return cb(err)
        let decoded = decodeToken(token)
        let address = decoded.payload.iss
        if (!err) self.address = address
        cb(err, address)
      })
    }
  }
}

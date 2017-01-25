/*
 * Emulate 'eth_accounts' / 'eth_sendTransaction' using 'eth_sendRawTransaction'
 *
 * The two callbacks a user needs to implement are:
 * TODO - update this
 * - getAccounts() -- array of addresses supported
 * - signTransaction(tx) -- sign a raw transaction object
 */

import Subprovider from 'web3-provider-engine/subproviders/subprovider'
import { decodeToken } from 'jsontokens'

// handles the following RPC methods:
// eth_sendTransaction

class UportSubprovider extends Subprovider {
  constructor (opts) {
    super()
    // Chasqui URL (default to standard)
    this.msgServer = opts.msgServer

    this.closeQR = opts.closeQR
    this.isQRCancelled = opts.isQRCancelled
    this.resetQRCancellation = opts.resetQRCancellation

    // Set address if present
    this.address = opts.address
  }

  handleRequest (payload, next, end) {
    const self = this

    switch (payload.method) {

      case 'eth_sendTransaction':
        let txParams = payload.params[0]

        self.txParamsToUri(txParams, (err, val) => {
          // TODO what about error?
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


    const listener = new Promise((resolve, reject) => {
      self.msgServer.waitForResult(topic, function (err, txHash) {
        if (err) { reject(err) }
        // self.closeQR()
        resolve(txHash)
      })
    })

    const res = { "uri": ethUri, "listen": listener }

    // TODO hack, not necessary to return through callback, can maybe remove while still using web3, may also just need to wait.
    cb(null, res)

  }
}

export default UportSubprovider

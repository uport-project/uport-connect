/*
 * Autosigner is a simple class that uses lightwallet and acts as a QRDisplay
 * to automatically sign transactions from the uportProvider. This can be used
 * in order to create efficient tests.
 */
import Lightwallet from 'eth-lightwallet'
import Transaction from 'ethereumjs-tx'
import Web3 from 'web3'
import url from 'url'
import querystring from 'querystring'
import nets from 'nets'
import { isMNID, decode, encode } from 'mnid'

const PASSWORD = 'password'
const SEED = 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle'

class Autosigner {

  constructor (web3Provider, keystore, pwDerivedKey) {
    keystore.generateNewAddress(pwDerivedKey)
    this.address = '0x' + keystore.getAddresses()[0]
    this.keystore = keystore
    this.pwDerivedKey = pwDerivedKey
    this.web3 = new Web3(web3Provider)
  }

  static load (web3Provider, cb) {
    Lightwallet.keystore.deriveKeyFromPassword(PASSWORD, (err, pwDerivedKey) => {
      if (err) cb(err)
      let KeystoreMethod = Lightwallet.keystore
      let Keystore = new KeystoreMethod(SEED, pwDerivedKey)
      let autosigner = new Autosigner(web3Provider, Keystore, pwDerivedKey)
      cb(null, autosigner)
    })
  }

  openQr (data) {
    let res = Autosigner.parse(data)
    let body = {}
    if (res.to === 'me') {
      // Hardcoded dummy JWT containing the address
      // Note that the signature will not match
      body.access_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL1ViTHNvTDNpT1R4c2J1c1oiLCJ0eXBlIjoic2hhcmVSZXNwIiwiaXNzIjoiMHg1MWY3OTM0OTMwZTUwMmExYTgzODFlOWZlYzlkOTMzY2Y3MzUwMjg1IiwiaWF0IjoxNDgyNDMwNzI5OTgxLCJleHAiOjE0ODI1MTcxMjk5ODF9.WDVC7Rl9lyeGzoNyxbJ7SRAyTIqLKu2bmYvO5I0DmEs5XWVGKsn16B9o6Zp0O5huX7StRRY3ujDoI1ofFoRf2A'

      setTimeout(Autosigner.postData.bind(null, res.callback_url, body), 3000)
    } else {
      this.sendTx(res, (err, tx) => {
        if (err) throw new Error(err)
        body.tx = tx
        setTimeout(Autosigner.postData.bind(null, res.callback_url, body), 3000)
      })
    }
  }

  closeQr () {}

  isQRCancelled () { return false }

  resetQRCancellation () {}

  sendTx (params, cb) {
    this.createAndSignTx(params, (err, signedTx) => {
      if (err) cb(err)
      this.web3.eth.sendRawTransaction(signedTx, (err, txHash) => {
        if (err) cb(err)
        cb(null, txHash)
      })
    })
  }

  createAndSignTx (params, cb) {
    this.web3.eth.getTransactionCount(this.address, (err, nonce) => {
      if (err) cb(err)
      let txObj = {
        gasPrice: 10000000000000,
        gasLimit: 3000000,
        nonce: nonce
      }
      if (params.to) { txObj.to = params.to }
      if (params.value) { txObj.value = this.web3.toHex(params.value) }
      if (params.data) { txObj.data = params.data }

      let tx = new Transaction(txObj).serialize().toString('hex')
      let signedTx = '0x' + Lightwallet.signing.signTx(this.keystore, this.pwDerivedKey, tx, this.address)
      cb(null, signedTx)
    })
  }

  static parse (uri) {
    let parsedUri = url.parse(uri)
    let address = parsedUri.pathname.slice(1)

    if (address !== 'me') {
      address = isMNID(address) ? decode(address).address : address
    }
    let parsedParams = querystring.parse(parsedUri.query)
    let result = {
      to: address,
      callback_url: parsedParams.callback_url,
      value: parsedParams.value,
      data: parsedParams.bytecode
    }
    if (result.to === 'create') { result.to = null }
    return result
  }

  static postData (url, body, cb) {
    if (!cb) cb = function () {}
    nets({
      url: url,
      method: 'POST',
      json: body
    }, cb)
  }
}

export default Autosigner

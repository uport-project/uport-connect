/*
 * Autosigner is a simple class that uses lightwallet and acts as a QRDisplay
 * to automatically sign transactions from the uportProvider. This can be used
 * in order to create efficient tests.
 */
import Web3 from 'web3'
import url from 'url'
import querystring from 'querystring'
import nets from 'nets'
import { isMNID, decode, encode } from 'mnid'
const sign = require('ethjs-signer').sign
const BN = require('bignumber.js')

const address = '0x0F6af8F8D7AAD198a7607C96fb74Ffa02C5eD86B'
const privateKey = '0xecbcd9838f7f2afa6e809df8d7cdae69aa5dfc14d563ee98e97effd3f6a652f2'

class Autosigner {

  constructor (web3Provider) {
    this.address = address
    this.web3 = new Web3(web3Provider)
  }

  static load (web3Provider, cb) {
    let autosigner = new Autosigner(web3Provider)
    cb(null, autosigner)
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
         gasPrice: new BN(1000000000000),
         gasLimit: new BN(3000000),
        nonce: nonce
      }
      if (params.to) { txObj.to = params.to }
      if (params.value) { txObj.value = this.web3.toHex(params.value) }
      if (params.data) { txObj.data = params.data }
      cb(null, sign(txObj, privateKey))
    })
  }

  static parse (uri) {
    let parsedUri = url.parse(uri)
    let address = uri.match(/:(?:(?!\?).)*/)[0].slice(1)

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

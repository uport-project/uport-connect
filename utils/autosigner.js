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
      body.access_token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1Mjk0MTU0NTQsImV4cCI6MTUyOTUwMTg1NCwiYXVkIjoiaHR0cHM6Ly9jaGFzcXVpLnVwb3J0Lm1lL2FwaS92MS90b3BpYy9QZnZaVXpTdWY5UjF4c0RzIiwidHlwZSI6InNoYXJlUmVzcCIsIm5hZCI6IjJvZnFQSHR0R1h2b1B5NE5iaThncHp4ZUVoblZSR0J0ZnF4Iiwib3duIjp7Im5hbWUiOiJaYWNoIn0sImlzcyI6IjJvZnFQSHR0R1h2b1B5NE5iaThncHp4ZUVoblZSR0J0ZnF4In0.UjNOMs2H6EDrozSH6RAMrVeucYEI9zSiDTYR9Qj7k6SVOR8QDhsDVQ1jBjHt6qBClTRtd8DH18r6KtvR9qaguA'

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

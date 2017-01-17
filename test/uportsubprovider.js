import { assert } from 'chai'
import UportSubprovider from '../lib/uportsubprovider.js'

const cancelHandler = {isCancelled: function () {return false},
                      resetCancellation: function () {}}

let pollShouldFail = false
let mochMsgServer = {
  newTopic: (topicName) => {
    return {
      name: 'topic',
      id: 'sdfghjkl',
      url: 'http://url.com'
    }
  },
  pollForResult: (topic, cancelHandler, cb) => {
    if (pollShouldFail) {
      cb(new Error('Polling error'))
    } else {
      cb(null, MSG_DATA)
    }
    return MSG_DATA
  },
  setOnMobile: () => {}
}
mochMsgServer.waitForResult = (topic, cancelHandler, cb) => { mochMsgServer.pollForResult(topic, cancelHandler, cb) }

const MSG_DATA = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL0lySGVsNTA0MmlwWlk3Q04iLCJ0eXBlIjoic2hhcmVSZXNwIiwiaXNzIjoiMHg4MTkzMjBjZTJmNzI3NjgwNTRhYzAxMjQ4NzM0YzdkNGY5OTI5ZjZjIiwiaWF0IjoxNDgyNDI2MjEzMTk0LCJleHAiOjE0ODI1MTI2MTMxOTR9.WDVC7Rl9lyeGzoNyxbJ7SRAyTIqLKu2bmYvO5I0DmEs5XWVGKsn16B9o6Zp0O5huX7StRRY3ujDoI1ofFoRf2A'

const UPORT_ID = '0x819320ce2f72768054ac01248734c7d4f9929f6c'

let subprovider
let qrWasClosed = false

describe('UportSubprovider', () => {
  before(() => {
    let opts = {
      msgServer: mochMsgServer,
      ethUriHandler: (uri) => {},
      closeQR: () => {
        qrWasClosed = true
      },
      isQRCancelled: () => {return false},
      resetQRCancellation: () => {}
    }
    subprovider = new UportSubprovider(opts)
  })

  describe('getAddress', () => {
    it('Use msgServer to get address first time', (done) => {
      subprovider.uportConnectHandler = (uri) => {
        assert.equal(uri, 'me.uport:me?callback_url=http://url.com')
      }
      subprovider.getAddress((err, address) => {
        assert.isNull(err)
        assert.equal(address, UPORT_ID)
        assert.isTrue(qrWasClosed)
        done()
      })
    })

    it('Should return address directly if present', (done) => {
      qrWasClosed = false
      subprovider.uportConnectHandler = (uri) => {
        assert.fail()
      }
      subprovider.getAddress((err, address) => {
        assert.isNull(err)
        assert.equal(address, UPORT_ID)
        assert.isFalse(qrWasClosed)
        done()
      })
    })

    it('Error should propagate from msgServer', (done) => {
      pollShouldFail = true
      subprovider.address = null
      subprovider.uportConnectHandler = (uri) => {}
      subprovider.getAddress((err, address) => {
        assert.isUndefined(address)
        assert.equal(err.message, 'Polling error')
        assert.isTrue(qrWasClosed)
        done()
      })
    })
  })

  describe('signAndReturnTxHash', () => {
    it('Use msgServer to get txHash', (done) => {
      qrWasClosed = false
      pollShouldFail = false
      let initialUri = 'me.uport:0x60dd15dec1732d6c8a6125b21f77d039821e5b93?value=10'
      subprovider.ethUriHandler = (uri) => {
        assert.equal(uri, initialUri + '&callback_url=http://url.com')
      }
      subprovider.signAndReturnTxHash(initialUri, (err, txHash) => {
        assert.isNull(err)
        assert.equal(txHash, MSG_DATA)
        assert.isTrue(qrWasClosed)
        done()
      })
    })

    it('Error should propagate from msgServer', (done) => {
      qrWasClosed = false
      pollShouldFail = true
      subprovider.ethUriHandler = (uri) => {}
      subprovider.signAndReturnTxHash('', (err, txHash) => {
        assert.isUndefined(txHash)
        assert.equal(err.message, 'Polling error')
        assert.isTrue(qrWasClosed)
        done()
      })
    })
  })

  describe('txParamsToUri', () => {
    let txParams = { to: '0x032f23' }
    it('Should add bytecode', (done) => {
      txParams.data = '0x23fad893'
      subprovider.txParamsToUri(txParams, (err, uri) => {
        if (err) { throw err }
        assert.equal(uri, 'me.uport:0x032f23?bytecode=0x23fad893')
        done()
      })
    })

    it('Should add value as decimal', (done) => {
      txParams.data = null
      txParams.value = '0x03fad4c3'
      subprovider.txParamsToUri(txParams, (err, uri) => {
        if (err) { throw err }
        assert.equal(uri, 'me.uport:0x032f23?value=66770115')
        done()
      })
    })

    it('Should add value before bytecode', (done) => {
      txParams.data = '0x23fad893'
      subprovider.txParamsToUri(txParams, (err, uri) => {
        if (err) { throw err }
        assert.equal(uri, 'me.uport:0x032f23?value=66770115&bytecode=0x23fad893')
        done()
      })
    })
  })

  describe('handleRequest', () => {
    let payload = {}
    it('Should pass on request not handled', (done) => {
      let nextCalled = false
      let next = () => { nextCalled = true }
      payload.method = 'eth_sendRawTransaction'
      subprovider.handleRequest(payload, next)
      assert.isTrue(nextCalled)
      done()
    })

    it('eth_coinbase should return address', (done) => {
      payload.method = 'eth_coinbase'
      pollShouldFail = false

      subprovider.handleRequest(payload, null, (err, address) => {
        if (err) { throw err }
        assert.equal(address, UPORT_ID)
        done()
      })
    })

    it('eth_accounts should return list with one address', (done) => {
      payload.method = 'eth_accounts'

      subprovider.handleRequest(payload, null, (err, addressList) => {
        if (err) { throw err }
        assert.equal(addressList[0], UPORT_ID)
        done()
      })
    })

    it('eth_sendTransaction should return txHash', (done) => {
      payload.method = 'eth_sendTransaction'
      payload.params = [{
        to: '0x032f23',
        value: '0x03fad4c3'
      }]
      subprovider.handleRequest(payload, null, (err, txHash) => {
        if (err) { throw err }
        assert.equal(txHash, MSG_DATA)
        done()
      })
    })
  })
})

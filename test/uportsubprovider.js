import { assert } from 'chai'
import UportSubprovider from '../lib/uportsubprovider.js'

let pollShouldFail = false
let mochMsgServer = {
  newTopic: (topicName) => {
    return {
      name: 'topic',
      id: 'sdfghjkl',
      url: 'http://url.com'
    }
  },
  pollForResult: (topic, cb) => {
    if (pollShouldFail) {
      cb(MSG_DATA)
    } else {
      cb(null, MSG_DATA)
    }
    return MSG_DATA
  },
  setOnMobile: () => {}
}
mochMsgServer.waitForResult = (topic, cb) => { mochMsgServer.pollForResult(topic, cb) }

const MSG_DATA = '0x0123456789abcdef'

let subprovider
let qrWasClosed = false

describe('UportSubprovider', () => {
  before(() => {
    let opts = {
      msgServer: mochMsgServer,
      ethUriHandler: (uri) => {},
      closeQR: () => {
        qrWasClosed = true
      }
    }
    subprovider = new UportSubprovider(opts)
  })

  describe('getAddress', () => {
    it('Use msgServer to get address first time', (done) => {
      subprovider.uportConnectHandler = (uri) => {
        assert.equal(uri, 'ethereum:me?callback_url=http://url.com')
      }
      subprovider.getAddress((err, address) => {
        assert.isNull(err)
        assert.equal(address, MSG_DATA)
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
        assert.equal(address, MSG_DATA)
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
        assert.equal(err, MSG_DATA)
        assert.isTrue(qrWasClosed)
        done()
      })
    })
  })

  describe('signAndReturnTxHash', () => {
    it('Use msgServer to get txHash', (done) => {
      qrWasClosed = false
      pollShouldFail = false
      let initialUri = 'ethereum:me?value=10'
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
        assert.equal(err, MSG_DATA)
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
        assert.equal(uri, 'ethereum:0x032f23?bytecode=0x23fad893')
        done()
      })
    })

    it('Should add value as decimal', (done) => {
      txParams.data = null
      txParams.value = '0x03fad4c3'
      subprovider.txParamsToUri(txParams, (err, uri) => {
        if (err) { throw err }
        assert.equal(uri, 'ethereum:0x032f23?value=66770115')
        done()
      })
    })

    it('Should add value before bytecode', (done) => {
      txParams.data = '0x23fad893'
      subprovider.txParamsToUri(txParams, (err, uri) => {
        if (err) { throw err }
        assert.equal(uri, 'ethereum:0x032f23?value=66770115&bytecode=0x23fad893')
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
        assert.equal(address, MSG_DATA)
        done()
      })
    })

    it('eth_accounts should return list with one address', (done) => {
      payload.method = 'eth_accounts'

      subprovider.handleRequest(payload, null, (err, addressList) => {
        if (err) { throw err }
        assert.equal(addressList[0], MSG_DATA)
        done()
      })
    })

    it('eth_sendTransaction should return txHash', (done) => {
      payload.method = 'eth_sendTransaction'
      payload.params = [{
        from: MSG_DATA,
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

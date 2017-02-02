import { assert } from 'chai'
import UportSubprovider from '../lib/uportSubprovider.js'
import { Uport } from '../lib/uport'

const MSG_DATA = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL0lySGVsNTA0MmlwWlk3Q04iLCJ0eXBlIjoic2hhcmVSZXNwIiwiaXNzIjoiMHg4MTkzMjBjZTJmNzI3NjgwNTRhYzAxMjQ4NzM0YzdkNGY5OTI5ZjZjIiwiaWF0IjoxNDgyNDI2MjEzMTk0LCJleHAiOjE0ODI1MTI2MTMxOTR9.WDVC7Rl9lyeGzoNyxbJ7SRAyTIqLKu2bmYvO5I0DmEs5XWVGKsn16B9o6Zp0O5huX7StRRY3ujDoI1ofFoRf2A'
const UPORT_ID = '0x819320ce2f72768054ac01248734c7d4f9929f6c'

const mockConnect = () => {
  return new Promise((resolve, reject) => {
    resolve(UPORT_ID)
  })
}

const failingConnect = () => {
  return new Promise((resolve, reject) => {
    reject(Error('Polling error'))
  })
}

const dontConnect = () => {
  assert.fail()
}

const mockSendTransaction = (txparams) => {
  return new Promise((resolve, reject) => {
    resolve(MSG_DATA)
  })
}

const failingSendTransaction = (txparams) => {
  return new Promise((resolve, reject) => {
    reject(Error('Polling error'))
  })
}

describe('UportSubprovider', () => {
  describe('getAddress', () => {
    it('Use connect to get address first time', (done) => {
      const subprovider = new UportSubprovider({connect: mockConnect})
      subprovider.getAddress((err, address) => {
        assert.isNull(err)
        assert.equal(address, UPORT_ID)
        // assert.equal(subprovider.address, UPORT_ID)
        done()
      })
    })

    it('Should return address directly if present', (done) => {
      const subprovider = new UportSubprovider({connect: dontConnect})
      subprovider.address = UPORT_ID
      subprovider.getAddress((err, address) => {
        assert.isNull(err)
        assert.equal(address, UPORT_ID)
        done()
      })
    })

    it('Error should propagate from connect', (done) => {
      const subprovider = new UportSubprovider({connect: failingConnect})
      subprovider.getAddress((err, address) => {
        assert.isUndefined(address)
        assert.equal(err.message, 'Polling error')
        done()
      })
    })
  })

  describe('sendTransaction', () => {
    it('Use uport.sendTransaction to send successfull transaction', (done) => {
      const subprovider = new UportSubprovider({sendTransaction: mockSendTransaction})
      subprovider.sendTransaction({}, (err, txHash) => {
        assert.isNull(err)
        assert.equal(txHash, MSG_DATA)
        done()
      })
    })

    it('Error should propagate from uport.sendTransaction', (done) => {
      const subprovider = new UportSubprovider({sendTransaction: failingSendTransaction})
      subprovider.sendTransaction({}, (err, txHash) => {
        assert.isUndefined(txHash)
        assert.equal(err.message, 'Polling error')
        done()
      })
    })
  })

  describe('handleRequest', () => {
    const subprovider = new UportSubprovider({
      connect: mockConnect,
      sendTransaction: mockSendTransaction
    })
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

import { expect, assert } from 'chai'
import { ConnectLite } from '../src/indexLite'
import { Credentials } from 'uport'
const sinon = require('sinon')

// import MockDate from 'mockdate'
// MockDate.set(1485321133996)
const CREDENTIALS_JWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJyZXF1ZXN0ZWQiOlsibmFtZSIsInBob25lIl0sImlzcyI6IjB4MDAxMTIyIiwiaWF0IjoxNDg1MzIxMTMzOTk2fQ.zxGLQKo2WjgefrxEQWfwm_oago8Qr4YctBJoqNAm2XKE-48bADjolSo2T_tED9LnSikxqFIM9gNGpNgcY8JPdg'
const REQUEST_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.fyJyZXF1ZXN0ZWQiOlsibmFtZSIsInBob25lIl0sImlzcyI6IjB4MDAxMTIyIiwiaWF0IjoxNDg1MzIxMTMzOTk2fQ.zxGLQKo2WjgefrxEQWfwm_oago8Qr4YctBJoqNAm2XKE-48bADjolSo2T_tED9LnSikxqFIM9gNGpNgcY8JPdg'
const CONTRACT = '0x819320ce2f72768054ac01248734c7d4f9929f6c'
const UPORT_ID = '0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c'
const CLIENT_ID = '0xa19320ce2f72768054ac01248734c7d4f9929f6d'
const FAKETX = '0x21893aaa10bb28b5893bcec44b33930c659edcd2f3f08ad9f3e69d8997bef238'

const publicKey = '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479'
const PUSH_TOKEN = 'PUSHTHIS'
const PROFILE = {publicKey, name: 'David Chaum', address: '0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c'}

function mockVerifyingCredentials (receive) {
  return {
    settings: {},
    receive: (jwt) => new Promise((resolve) => resolve(receive(jwt)))
  }
}

function mockSigningCredentials ({createRequest, receive}) {
  return {
    settings: {signer: (data, cb) => cb(null, 'SIGNATURE'), address: CLIENT_ID},
    createRequest: (payload) => new Promise((resolve, reject) => resolve(createRequest(payload))),
    receive: (jwt) => new Promise((resolve) => resolve(receive(jwt)))
  }
}

function mockAttestingCredentials (mockfn) {
  return {
    settings: {},
    attest: (payload) => new Promise((resolve, reject) => resolve(mockfn(payload)))
  }
}

// const registry = (address) => new Promise((resolve, reject) => { console.log(`registry: ${address}`); resolve(address === '0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c' ? profileA : null) })
// const credentials = new Credentials({signer, address: '0xa19320ce2f72768054ac01248734c7d4f9929f6d', registry})

const mockTopic = (response = UPORT_ID) => {
  const topic = new Promise((resolve, reject) => resolve(response))
  topic.url = 'https://chasqui.uport.me/api/v1/topic/123'
  return topic
}

const errorTopic = () => {
  const topic = new Promise((resolve, reject) => reject(new Error('It broke')))
  topic.url = 'https://chasqui.uport.me/api/v1/topic/123'
  return topic
}

describe('ConnectLite', () => {
  describe('config', () => {
    it('defaults', () => {
      const uport = new ConnectLite('test app')
      expect(uport.appName).to.equal('test app')
      expect(uport.infuraApiKey).to.equal('test-app')
      expect(uport.network.id).to.equal('0x3')
      expect(uport.uriHandler.name).to.equal('defaultUriHandler')
      expect(uport.closeUriHandler).to.equal(undefined)
    })

    it('throws error if the network config object is not well formed ', () => {
      try { new ConnectLite('test app', {network: {id: '0x5'}}) } catch (e) { return }
      throw new Error('did not throw error')
    })
  })

  describe('request', () => {
    const uri = 'me.uport:me'

    it('defaults to a given preset uriHandler', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', {uriHandler})
      return uport.request({topic: mockTopic(), uri}).then(response => {
        expect(response, 'uport.request response').to.equal(UPORT_ID)
        expect(uriHandler.calledWith(uri), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('works fine without a closeUriHandler', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', { uriHandler })
      return uport.request({topic: mockTopic(), uri}).then(response => {
        expect(response, 'uport.request response').to.equal(UPORT_ID)
        expect(uriHandler.calledWith(uri), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('can be overriden by a passed in uriHandler', () => {
      const uriHandler = sinon.spy(), closeUriHandler = sinon.spy(), uriHandlerDefault = sinon.spy()
      const uport = new ConnectLite('UportTests', { uriHandler: uriHandlerDefault, closeUriHandler })
      return uport.request({
        uri,
        topic: mockTopic(),
        uriHandler
      }).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(uriHandler.calledWith(uri), uriHandler.lastCall.args[0]).to.be.true
        expect(closeUriHandler.called, 'closeUriHandler called').to.be.false
        expect(uriHandlerDefault.called, 'default uriHandler called').to.be.false
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('uses the preset mobileUriHandler', () => {
      const mobileUriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', { isMobile: true, mobileUriHandler })
      return uport.request({ uri, topic: mockTopic()})
        .then(response => {
          expect(response, 'uport.request response').to.equal(UPORT_ID)
          expect(mobileUriHandler.calledWith(uri), mobileUriHandler.lastCall.args[0]).to.be.true
        }, error => {
          throw new Error('uport.request Promise rejected, expected it to resolve')
        })
    })

    it('uses the preset mobileUriHandler even if there is a local override', () => {
      const mobileUriHandler = sinon.spy(), uriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', { isMobile: true, mobileUriHandler })
      return uport.request({
        uri,
        topic: mockTopic(),
        uriHandler
      }).then(response => {
        expect(response, 'uport.request response').to.equal(UPORT_ID)
        expect(mobileUriHandler.calledWith(uri), mobileUriHandler.lastCall.args[0]).to.be.true
        expect(uriHandler.called, 'uriHandler called').to.be.false
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })
  })

  describe('requestCredentials', () => {
    describe('without signer', () => {
      it('requests public profile', () => {
        const uriHandler = sinon.spy()
        const uport = new ConnectLite('UportTests', {
          clientId: CLIENT_ID,
          topicFactory: (name) => {
            expect(name, 'topic name').to.equal('access_token')
            return mockTopic(CREDENTIALS_JWT)
          },
          uriHandler
        })
        // Stub Registry
        const sendTransaction = sinon.stub(uport, 'registry').callsFake((address, cb) => {
          return cb(null, PROFILE)
        })
        return uport.requestCredentials().then(profile => {
          expect(uriHandler.calledWith(`me.uport:me?label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=${CLIENT_ID}`), uriHandler.lastCall.args[0]).to.be.true
          expect(profile.name, 'uport.requestCredentials profile').to.equal(PROFILE.name)
        }, error => {
          throw new Error(error + 'uport.request Promise rejected, expected it to resolve')
        })
      })

      it('throws error when requesting specific credentials', () => {
        const uport = new ConnectLite('UportTests')
        return uport.requestCredentials({requested: ['phone']}).then(profile => {
          throw new Error('uport.request Promise resolved, expected it to reject')
        }, error => {
          expect(error.message).to.match(/Specific data can not be requested/)
        })
      })
    })
  })

  describe('requestAddress', () => {
    it('returns address', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name, 'topic name').to.equal('access_token')
          return mockTopic(CREDENTIALS_JWT)
        },
        uriHandler
      })
      // Stub Registry
      const sendTransaction = sinon.stub(uport, 'registry').callsFake((address, cb) => {
        return cb(null, PROFILE)
      })
      return uport.requestAddress().then(address => {
        // '0x001122' Iss of JWT response
        expect(address, 'uport.requestAddress address').to.equal('0x001122')
        expect(uriHandler.calledWith(`me.uport:me?label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=${CLIENT_ID}`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })
  })

  describe('getProvider', () => {
    it('returns a provider with same network settings as connect', () => {
      const netConfig = { id: '0x5', registry: '0xab6c9051b9a1eg1abc1250f8b0640848c8ebfcg6', rpcUrl: 'https://somenet.io' }
      const uport = new ConnectLite('test app', {network: netConfig})
      const provider = uport.getProvider()
      expect(uport.network.rpcUrl, 'uport.network.rpcUrl').to.equal(provider.provider.host)
    })
  })

  describe('sendTransaction', () => {
    it('shows simple value url', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name).to.equal('tx')
          return mockTopic(FAKETX)
        },
        uriHandler,
        closeUriHandler: () => null
      })
      return uport.sendTransaction({to: CONTRACT, value: '0xff'}).then(txhash => {
        expect(txhash, 'uport.sendTransaction txhash').to.equal(FAKETX)
        expect(uriHandler.calledWith(`me.uport:2oRMMSWkzMKpqkWpBxr5Xa9zMRXG4QBzJYM?value=255&label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=${CLIENT_ID}`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('shows simple url with function', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name).to.equal('tx')
          return mockTopic(FAKETX)
        },
        uriHandler,
        closeUriHandler: () => null
      })
      return uport.sendTransaction({
        to: CONTRACT,
        value: '0xff',
        data: 'abcdef01',
        gas: '0x4444',
        function: `transfer(address ${UPORT_ID},uint 12312)`
      }).then(txhash => {
        expect(txhash, 'uport.sendTransaction txhash').to.equal(FAKETX)
        // Note it intentionally leaves out data as function overrides it
        // gas is not included in uri
        expect(uriHandler.calledWith(`me.uport:2oRMMSWkzMKpqkWpBxr5Xa9zMRXG4QBzJYM?value=255&function=transfer(address%200x3b2631d8e15b145fd2bf99fc5f98346aecdc394c%2Cuint%2012312)&label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=0xa19320ce2f72768054ac01248734c7d4f9929f6d`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('shows simple url with data', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name).to.equal('tx')
          return mockTopic('FAKETX')
        },
        uriHandler,
        closeUriHandler: () => null
      })
      return uport.sendTransaction({
        to: CONTRACT,
        value: '0xff',
        data: 'abcdef01',
        gas: '0x4444'
      }).then(txhash => {
        expect(txhash, 'uport.sendTransaction txhash').to.equal('FAKETX')
        expect(uriHandler.calledWith(`me.uport:2oRMMSWkzMKpqkWpBxr5Xa9zMRXG4QBzJYM?value=255&bytecode=abcdef01&label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=${CLIENT_ID}`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('throws an error for contract transactions', () => {
      const uriHandler = sinon.spy(), closeUriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', { uriHandler, closeUriHandler })
      expect(
        () => uport.sendTransaction({
          value: '0xff',
          data: 'abcdef01',
          gas: '0x4444'
        })
      ).to.throw('Contract creation is not supported by uportProvider')
    })
  })

  describe('contract', () => {
    const miniTokenABI = [{
      'constant': false,
      'inputs': [
        {
          'name': '_to',
          'type': 'address'
        },
        {
          'name': '_value',
          'type': 'uint256'
        }
      ],
      'name': 'transfer',
      'outputs': [
        {
          'name': 'success',
          'type': 'bool'
        }
      ],
      'payable': false,
      'type': 'function'
    }]
    it('shows correct uri to default uriHandler', () => {
      const uriHandler = sinon.spy(), closeUriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name, 'topic name').to.equal('tx')
          return mockTopic(FAKETX)
        },
        uriHandler,
        closeUriHandler
      })
      const contract = uport.contract(miniTokenABI)
      const token = contract.at('0x819320ce2f72768054ac01248734c7d4f9929f6c')
      return token.transfer('0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c', 12312).then(txhash => {
        expect(txhash, 'token.transfer txhash').to.equal(FAKETX)
        expect(uriHandler.calledWith(`me.uport:2oRMMSWkzMKpqkWpBxr5Xa9zMRXG4QBzJYM?function=transfer(address%200x3b2631d8e15b145fd2bf99fc5f98346aecdc394c%2C%20uint256%2012312)&label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=0xa19320ce2f72768054ac01248734c7d4f9929f6d`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('shows correct uri to overridden uriHandler', () => {
      const overideUriHandler = sinon.spy(), closeUriHandler = sinon.spy()
      const uport = new ConnectLite('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name, 'topic name').to.equal('tx')
          return mockTopic(FAKETX)
        },
        closeUriHandler
      })
      const token = uport.contract(miniTokenABI).at('0x819320ce2f72768054ac01248734c7d4f9929f6c')
      return token.transfer('0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c', 12312, overideUriHandler).then(txhash => {
        expect(txhash, 'token.transfer txhash').to.equal(FAKETX)
        expect(overideUriHandler.calledWith(`me.uport:2oRMMSWkzMKpqkWpBxr5Xa9zMRXG4QBzJYM?function=transfer(address%200x3b2631d8e15b145fd2bf99fc5f98346aecdc394c%2C%20uint256%2012312)&label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=0xa19320ce2f72768054ac01248734c7d4f9929f6d`), overideUriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('MNID encodes contract addresses in requests', () => {
      const uport = new ConnectLite('UportTests')
      const sendTransaction = sinon.stub(uport, 'request').callsFake(({uri}) => {
        expect(uri, 'request consumes uri').to.match(/2oRMMSWkzMKpqkWpBxr5Xa9zMRXG4QBzJYM/)
      })
      const token = uport.contract(miniTokenABI).at('0x819320ce2f72768054ac01248734c7d4f9929f6c')
      return token.transfer('0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c', 12312)
    })

    it('accepts contracts at both addresses and MNID encoded adresses', () => {
      const uport = new ConnectLite('UportTests')
      const uportMNID = new ConnectLite('UportTests')
      const contractAddress = '0x819320ce2f72768054ac01248734c7d4f9929f6c'
      const stubFunc = ({uri}) => {
        expect(uri).to.match(/2oRMMSWkzMKpqkWpBxr5Xa9zMRXG4QBzJYM/)
      }
      const sendTransaction = sinon.stub(uport, 'request').callsFake(stubFunc)
      const sendTransactionMNID = sinon.stub(uportMNID, 'request').callsFake(stubFunc)
      const token = uport.contract(miniTokenABI).at(contractAddress)
      token.transfer('0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c', 12312)
      const tokenMNID = uportMNID.contract(miniTokenABI).at(contractAddress)
      tokenMNID.transfer('0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c', 12312)
    })
  })

})

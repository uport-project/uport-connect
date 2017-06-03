import { expect, assert } from 'chai'
import { ConnectCore } from '../src/indexCore'
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

describe('ConnectCore', () => {
  describe('config', () => {
    it('defaults', () => {
      const uport = new ConnectCore('test app')
      expect(uport.appName).to.equal('test app')
      expect(uport.infuraApiKey).to.equal('test-app')
      expect(uport.network.id).to.equal('0x3')
      expect(uport.uriHandler.name).to.equal('defaultUriHandler')
      expect(uport.closeUriHandler).to.equal(undefined)
      expect(uport.credentials).to.be.an.instanceof(Credentials)
      expect(uport.canSign).to.be.false
      expect(uport.getWeb3).to.equal(undefined)
    })

    it('does not have a closeUriHandler if not using built in openQr', () => {
      const noop = (uri) => null
      const uport = new ConnectCore('test', {uriHandler: noop})
      expect(uport.uriHandler).to.equal(noop)
      expect(uport.closeUriHandler, 'uport.closeUriHandler').to.be.undefined
    })

    it('configures credentials correctly', () => {
      const signer = () => null
      const uport = new ConnectCore('test app', {clientId: CLIENT_ID, signer})
      expect(uport.credentials).to.be.an.instanceof(Credentials)
      expect(uport.clientId, 'uport.clientId').to.equal(CLIENT_ID)
      expect(uport.credentials.settings.address, 'uport.credentials.settings.address').to.equal(CLIENT_ID)
      expect(uport.credentials.settings.signer).to.equal(signer)
      expect(uport.canSign, 'uport.canSign').to.be.true
    })

    it('configures the network in connect and in credentials give a supported string', () => {
      const uport = new ConnectCore('test app', {network: 'mainnet'})
      expect(uport.network.id, 'uport.network.id').to.equal('0x1')
      expect('0x1' in uport.credentials.settings.networks, 'uport.credentials.settings.networks includes 0x1').to.be.true
    })

    it('configures the network in connect and in credentials given a well formed network config object', () => {
      const netConfig = { id: '0x5', registry: '0xab6c9051b9a1eg1abc1250f8b0640848c8ebfcg6', rpcUrl: 'https://somenet.io' }
      const uport = new ConnectCore('test app', {network: netConfig})
      expect(uport.network.id, 'uport.network.id').to.equal('0x5')
      expect('0x5' in uport.credentials.settings.networks, 'uport.credentials.settings.networks includes 0x5').to.be.true
    })
  })

  describe('request', () => {
    const uri = 'me.uport:me'

    it('defaults to the preset uriHandler', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectCore('UportTests', {uriHandler})
      return uport.request({topic: mockTopic(), uri}).then(response => {
        expect(response, 'uport.request response').to.equal(UPORT_ID)
        expect(uriHandler.calledWith(uri), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('works fine without a closeUriHandler', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectCore('UportTests', { uriHandler })
      return uport.request({topic: mockTopic(), uri}).then(response => {
        expect(response, 'uport.request response').to.equal(UPORT_ID)
        expect(uriHandler.calledWith(uri), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('can be overriden by a passed in uriHandler', () => {
      const uriHandler = sinon.spy(), closeUriHandler = sinon.spy(), uriHandlerDefault = sinon.spy()
      const uport = new ConnectCore('UportTests', { uriHandler: uriHandlerDefault, closeUriHandler })
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
      const uport = new ConnectCore('UportTests', { isMobile: true, mobileUriHandler })
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
      const uport = new ConnectCore('UportTests', { isMobile: true, mobileUriHandler })
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

    it('sends a push notification if push token is available', () => {
      const uport = new ConnectCore('UportTests')
      uport.pushToken = '12345'
      const pushFunc = sinon.stub(uport.credentials, 'push')

      return uport.request({topic: mockTopic(), uri}).then(response => {
        expect(pushFunc.calledOnce, 'uport.credentials.push called').to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('does not call default uriHandler if push notification sent', () => {
      const uport = new ConnectCore('UportTests')
      uport.pushToken = '12345'
      const pushFunc = sinon.stub(uport.credentials, 'push')
      const uriHandlerFunc = sinon.stub(uport, 'uriHandler')

      return uport.request({topic: mockTopic(), uri}).then(response => {
        expect(pushFunc.calledOnce, 'uport.credentials.push called').to.be.true
        expect(uriHandlerFunc.called, 'uriHandler called').to.be.false
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })
  })

  describe('requestCredentials', () => {
    describe('without signer', () => {
      it('requests public profile', () => {
        const uriHandler = sinon.spy()
        const uport = new ConnectCore('UportTests', {
          clientId: CLIENT_ID,
          topicFactory: (name) => {
            expect(name, 'topic name').to.equal('access_token')
            return mockTopic(CREDENTIALS_JWT)
          },
          uriHandler,
          credentials: mockVerifyingCredentials((jwt) => {
            expect(jwt).to.equal(CREDENTIALS_JWT)
            return PROFILE
          })
        })
        expect(uport.canSign).to.be.false
        return uport.requestCredentials().then(profile => {
          expect(uriHandler.calledWith(`me.uport:me?label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=${CLIENT_ID}`), uriHandler.lastCall.args[0]).to.be.true
          expect(profile, 'uport.requestCredentials profile').to.equal(PROFILE)
        }, error => {
          throw new Error('uport.request Promise rejected, expected it to resolve')
        })
      })

      it('throws error when requesting specific credentials', () => {
        const uport = new ConnectCore('UportTests')
        expect(uport.canSign, 'uport.canSign').to.be.false
        return uport.requestCredentials({requested: ['phone']}).then(profile => {
          throw new Error('uport.request Promise resolved, expected it to reject')
        }, error => {
          expect(error.message).to.equal('Specific data can not be requested without a signer configured')
        })
      })

      it('throws error when requesting notifications', () => {
        const uport = new ConnectCore('UportTests')
        expect(uport.canSign, 'uport.canSign').to.be.false
        return uport.requestCredentials({ notifications: true }).then(profile => {
          throw new Error('uport.request Promise resolved, expected it to reject')
        }, error => {
          expect(error.message).to.equal('Notifications rights can not currently be requested without a signer configured')
        })
      })
    })

    describe('with signer', () => {
      it('requests public profile', () => {
        const uriHandler = sinon.spy()
        const uport = new ConnectCore('UportTests', {
          clientId: CLIENT_ID,
          topicFactory: (name) => {
            expect(name, 'topic name').to.equal('access_token')
            return mockTopic(CREDENTIALS_JWT)
          },
          uriHandler,
          credentials: mockSigningCredentials(
            {
              receive: (jwt) => {
                expect(jwt).to.equal(CREDENTIALS_JWT)
                return PROFILE
              },
              createRequest: (payload) => {
                expect(payload).to.be.deep.equal({ callbackUrl: 'https://chasqui.uport.me/api/v1/topic/123' })
                return REQUEST_TOKEN
              }
            })
        })
        expect(uport.canSign).to.be.true
        return uport.requestCredentials().then(profile => {
          expect(profile, 'uport.requestCredentials profile').to.equal(PROFILE)
          expect(uriHandler.calledWith(`me.uport:me?requestToken=${REQUEST_TOKEN}`), uriHandler.lastCall.args[0]).to.be.true
        }, error => {
          throw new Error('uport.request Promise rejected, expected it to resolve')
        })
      })
    })

    it('requests specific credentials', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectCore('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name, 'topic name').to.equal('access_token')
          return mockTopic(CREDENTIALS_JWT)
        },
        uriHandler,
        credentials: mockSigningCredentials(
          {
            receive: (jwt) => {
              expect(jwt).to.equal(CREDENTIALS_JWT)
              return PROFILE
            },
            createRequest: (payload) => {
              expect(payload).to.be.deep.equal({
                requested: ['phone'],
                notifications: true,
                callbackUrl: 'https://chasqui.uport.me/api/v1/topic/123'
              })
              return REQUEST_TOKEN
            }
          })
      })
      expect(uport.canSign).to.be.true
      return uport.requestCredentials({requested: ['phone'], notifications: true}).then(profile => {
        expect(profile, 'uport.requestCredentials profile').to.equal(PROFILE)
        expect(uriHandler.calledWith(`me.uport:me?requestToken=${REQUEST_TOKEN}`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('it saves a push notification token if push token is included in response', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectCore('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name, 'topic name').to.equal('access_token')
          return mockTopic(CREDENTIALS_JWT)
        },
        uriHandler,
        credentials: mockSigningCredentials(
          {
            receive: (jwt) => {
              expect(jwt).to.equal(CREDENTIALS_JWT)
              return {...PROFILE, pushToken: PUSH_TOKEN}
            },
            createRequest: (payload) => {
              expect(payload).to.be.deep.equal({
                notifications: true,
                callbackUrl: 'https://chasqui.uport.me/api/v1/topic/123'
              })
              return REQUEST_TOKEN
            }
          })
      })
      return uport.requestCredentials({notifications: true}).then(res => {
        expect(uport.pushToken, 'uport.pushToken').to.equal(PUSH_TOKEN)
        expect(res).to.be.deep.equal({...PROFILE, pushToken: PUSH_TOKEN})
        expect(uriHandler.calledWith(`me.uport:me?requestToken=${REQUEST_TOKEN}`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })
  })

  describe('requestAddress', () => {
    it('returns address', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectCore('UportTests', {
        clientId: CLIENT_ID,
        topicFactory: (name) => {
          expect(name, 'topic name').to.equal('access_token')
          return mockTopic(CREDENTIALS_JWT)
        },
        uriHandler,
        credentials: mockVerifyingCredentials(jwt => {
          expect(jwt).to.equal(CREDENTIALS_JWT)
          return PROFILE
        })
      })
      return uport.requestAddress().then(address => {
        expect(address, 'uport.requestAddress address').to.equal(UPORT_ID)
        expect(uriHandler.calledWith(`me.uport:me?label=UportTests&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123&client_id=${CLIENT_ID}`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })
  })

  describe('attestCredentials', () => {
    const ATTESTATION = 'ATTESTATION'
    const PAYLOAD = {sub: '0x3b2631d8e15b145fd2bf99fc5f98346aecdc394c', claim: { name: 'Bob' }, exp: 123123123}
    it('provides attestation to user using default uriHandler', () => {
      const uriHandler = sinon.spy()
      const uport = new ConnectCore('UportTests', {
        topicFactory: (name) => {
          expect(name, 'topic name').to.equal('status')
          return mockTopic('ok')
        },
        uriHandler,
        credentials: mockAttestingCredentials((payload) => {
          expect(payload).to.deep.equal(PAYLOAD)
          return ATTESTATION
        })
      })
      return uport.attestCredentials(PAYLOAD).then((result) => {
        expect(result, 'uport.attestCredentials response').to.equal('ok')
        expect(uriHandler.calledWith(`me.uport:add?attestations=${ATTESTATION}&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123`), uriHandler.lastCall.args[0]).to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })
  })
})

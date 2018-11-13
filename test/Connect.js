import chai, { expect, assert } from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import Web3 from 'web3'
import IPFS from 'ipfs-mini'

import { Connect } from '../src'
import { message } from 'uport-transports'
import { decodeJWT, verifyJWT } from 'did-jwt'

chai.use(sinonChai)

// TODO import from messages after
const isJWT = (jwt) => /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/.test(jwt)
const getURLJWT = (url) => url.replace(/https:\/\/id.uport.me\/req\//, '').replace(/(\#|\?)(.*)/, '')
const ipfs = new IPFS({host: 'ipfs.infura.io', port: 5001, protocol: 'https'})

const resJWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MzI0NTkyNzIsImV4cCI6MTUzMjU0NTY3MiwiYXVkIjoiMm9lWHVmSEdEcFU1MWJmS0JzWkRkdTdKZTl3ZUozcjdzVkciLCJ0eXBlIjoic2hhcmVSZXNwIiwibmFkIjoiMm91c1hUalBFRnJrZjl3NjY3YXR5R3hQY3h1R0Q0UEYyNGUiLCJvd24iOnsibmFtZSI6IlphY2giLCJjb3VudHJ5IjoiVVMifSwicmVxIjoiZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKRlV6STFOa3NpZlEuZXlKcFlYUWlPakUxTXpJME5Ua3lOalFzSW5KbGNYVmxjM1JsWkNJNld5SnVZVzFsSWl3aWNHaHZibVVpTENKamIzVnVkSEo1SWl3aVlYWmhkR0Z5SWwwc0luQmxjbTFwYzNOcGIyNXpJanBiSW01dmRHbG1hV05oZEdsdmJuTWlYU3dpWTJGc2JHSmhZMnNpT2lKb2RIUndjem92TDJOb1lYTnhkV2t1ZFhCdmNuUXViV1V2WVhCcEwzWXhMM1J2Y0dsakwxbzJNM1owVkdGclMyMXdjVlZxVUc0aUxDSnVaWFFpT2lJd2VEUWlMQ0owZVhCbElqb2ljMmhoY21WU1pYRWlMQ0pwYzNNaU9pSXliMlZZZFdaSVIwUndWVFV4WW1aTFFuTmFSR1IxTjBwbE9YZGxTak55TjNOV1J5SjkuRTZLd3ZiN1Z1Tks4a3VaNFVmODVhNFBJVXFhOTd2U2RUTEZOaTEtMzRyYXB0N0V1Q1hHYjU5UXo1MndtUmZIZUhhVS1ZVW5yN3lpZ0p0dE9CYlBZaHciLCJjYXBhYmlsaXRpZXMiOlsiZXlKMGVYQWlPaUpLVjFRaUxDSmhiR2NpT2lKRlV6STFOa3NpZlEuZXlKcFlYUWlPakUxTXpJME5Ua3lOeklzSW1WNGNDSTZNVFV6TXpjMU5USTNNaXdpWVhWa0lqb2lNbTlsV0hWbVNFZEVjRlUxTVdKbVMwSnpXa1JrZFRkS1pUbDNaVW96Y2pkelZrY2lMQ0owZVhCbElqb2libTkwYVdacFkyRjBhVzl1Y3lJc0luWmhiSFZsSWpvaVlYSnVPbUYzY3pwemJuTTZkWE10ZDJWemRDMHlPakV4TXpFNU5qSXhOalUxT0RwbGJtUndiMmx1ZEM5QlVFNVRMM1ZRYjNKMEx6QmtNVGcwWkRobExXVTBZbVF0TTJNMFl5MDRZbVUxTFdKa1ptSm1aV0kxTVRBeFpTSXNJbWx6Y3lJNklqSnZkWE5ZVkdwUVJVWnlhMlk1ZHpZMk4yRjBlVWQ0VUdONGRVZEVORkJHTWpSbEluMC4tdGFZVS1rVlRzNktJNUtQQ3R5akdHbTdOMFlfV0RNeVY2ZUVRdWZVS0ZXRllQdHZqYnpKMFZrdVdYTUtzb3lyZ0JmM1VxeE9iRzd0NW9ydGxOSm5WZyJdLCJwdWJsaWNFbmNLZXkiOiJKQUJ1dUpIK051ekgwS3NvaEdEUUt2elhkS0ltSXhJcklFN0k2dXBmMnpvPSIsImlzcyI6IjJvdXNYVGpQRUZya2Y5dzY2N2F0eUd4UGN4dUdENFBGMjRlIn0.9-1Yziz0SyB7RdKu_NUXvr64-KZBz30z0rS59oQoAz0fETmZB7Egezs_2YPkIsbjOeXo6st3ezZeXpc7nZOW-A"

describe('Connect', () => {

  beforeEach(() => {
    window.localStorage.clear()
  })

  /*********************************************************************/

  describe('constructor', () => {
    it('sets defaults', () => {
      const uport = new Connect()
      expect(uport.appName).to.equal('uport-connect-app')
      expect(uport.network.id).to.equal('0x4')
      expect(uport.accountType).to.be.undefined
      expect(uport.transport).to.be.a('function')
      expect(uport.mobileTransport).to.be.a('function')
      expect(uport.usePush).to.be.true
      expect(uport.isOnMobile).to.be.a('boolean')
      expect(uport.useStore).to.be.true
    })

    it('sets config vals if given config object', () => {
      const transport = sinon.stub()
      const mobileTransport = sinon.stub()
      const config = {
        network: 'mainnet',
        // provider: new HttpProvider(this.network.rpcUrl),
        accountType: 'keypair',
        isMobile: true,
        useStore: false,
        vc: ['jwt'],
        transport,
        mobileTransport
      }
      const uport = new Connect('test app', config)
      expect(uport.network.id).to.equal('0x1')
      expect(uport.accountType).to.equal('keypair')
      expect(uport.isOnMobile).to.be.true
      expect(uport.useStore).to.be.false
      expect(uport.vc).to.deep.equal(['jwt'])
      uport.transport('test')
      uport.mobileTransport('test')
      expect(transport).to.be.calledOnce
      expect(uport.usePush).to.be.true
      expect(mobileTransport).to.be.calledOnce
    })

    it('throws an error if a segregated account is requested on mainnet', () => {
      const config = {accountType: 'segregated', network: 'mainnet'}
      expect(() => new Connect('bad config', config)).to.throw
    })

    it('creates keypair if none in local storage', () => {
      expect(window.localStorage.getItem('connectState')).to.equal(null)
      const uport = new Connect('test app')
      expect(!!uport.keypair.did).to.be.true
      expect(!!uport.keypair.privateKey).to.be.true
    })

    it('initializes with keypair from local storage if available', () => {
      // Set some storage
      const uportSetStorage = new Connect('test app')
      const keypairDID = uportSetStorage.keypair.did
      const keypairPrivateKey = uportSetStorage.keypair.privateKey
      // Test if re-initialized with storage
      const uport = new Connect('testApp')
      expect(uport.keypair.did).to.equal(keypairDID)
      expect(uport.keypair.privateKey).to.equal(keypairPrivateKey)
    })

    it('initializes with did from local storage if available', () => {
      // Set some storage
      const uportSetStorage = new Connect('test app')
      const did = `did:ethr:woopity`
      // TODO update and test other vals
      uportSetStorage.did = did

      // Test if re-initialized with storage
      const uport = new Connect('testApp')
      expect(uport.did).to.equal(did)
    })
  })

  /*********************************************************************/

  describe('requestDisclosure', () => {
    const vc = ['fake']

    it('creates a request uri ', (done) => {
      const transport = (uri, opts) => {
        const jwt = message.util.getURLJWT(uri)
        expect(isJWT(jwt)).to.be.true
        done()
      }

      const uport = new Connect('testApp', {transport, vc})
      uport.requestDisclosure()
    })

    it('creates a JWT signed by keypair', (done) => {
      const transport = (uri, opts) => {
        const jwt = message.util.getURLJWT(uri)
        expect(isJWT(jwt)).to.be.true
        const decoded = decodeJWT(jwt)
        expect(decoded.payload.iss).is.equal(uport.keypair.did)
        done()
      }
      const uport = new Connect('testApp', {transport, vc})
      uport.requestDisclosure()
    })

    it('sets chasqui as callback if not on mobile', (done) => {
      const transport = (uri, opts) => {
        const jwt = message.util.getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(/chasqui/.test(decoded.payload.callback)).to.be.true
        done()
      }
      const uport = new Connect('testApp', {transport, vc})
      uport.requestDisclosure()
    })

    it('sets this window as callback if on mobile', (done) => {
      const mobileTransport = (uri, opts) => {
        const jwt = message.util.getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(/localhost/.test(decoded.payload.callback)).to.be.true
        done()
      }
      const uport = new Connect('testApp', {vc, mobileTransport, isMobile: true})
      uport.requestDisclosure()
    })

    it('calls send with request uri and id', (done) => {
      const send = (uri, id) => {
        expect(/eyJ0eXA/.test(uri)).to.be.true
        expect(!!id).to.be.true
        done()
      }
      const uport = new Connect('testApp', {vc})
      uport.send = send
      uport.requestDisclosure()
    })

    it('sets the accountType to none if not provided', (done) => {
      const uport = new Connect('test app none', {vc})
      uport.genCallback = sinon.stub()
      uport.send = sinon.stub()
      uport.credentials.createDisclosureRequest = (req) => {
        expect(req.accountType).to.equal('none')
        done()
      }

      uport.requestDisclosure()
    })

    it('uses configured vc if not provided in request', (done) => {
      const vc = ['details']
      const uport = new Connect('test app', {vc})

      uport.genCallback = sinon.stub()
      uport.send = sinon.stub()

      uport.credentials.createDisclosureRequest = (req) => {
        expect(req.vc).to.deep.equal(vc)
        done()
      }

      uport.requestDisclosure()
    })

    it('uses vc provided in the request', (done) => {
      const wrongvc = ['bad']
      const vc = ['good']
      const uport = new Connect('test app', {vc: wrongvc})

      uport.genCallback = sinon.stub()
      uport.send = sinon.stub()

      uport.credentials.createDisclosureRequest = (req) => {
        expect(req.vc).to.deep.equal(vc)
        done()
      }

      uport.requestDisclosure({vc})
    })

    it('sets the accountType to configured default if not provided in request', (done) => {
      const accountType = 'keypair'
      const uport = new Connect('test app keypair', {accountType, vc})
      uport.genCallback = sinon.stub()
      uport.send = sinon.stub()
      uport.credentials.createDisclosureRequest = (req) => {
        expect(req.accountType).to.equal(accountType)
        done()
      }

      uport.requestDisclosure()
    })

    it('uses the accountType provided in request', (done) => {
      const configAccountType = 'keypair'
      const accountType = 'general'
      const uport = new Connect('test app', {accountType: configAccountType, vc})
      uport.genCallback = sinon.stub()

      uport.credentials.createDisclosureRequest = (req) => {
        expect(req.accountType).to.equal(accountType)
        done()
      }

      uport.requestDisclosure({accountType})
    })
  })

  /*********************************************************************/
  describe('signAndUploadProfile', () => {
    it('skips upload if vc is preconfigured', async () => {
      const vc = ['fake']
      const uport = new Connect('test app', {vc})

      await uport.signAndUploadProfile()
      expect(uport.vc).to.deep.equal(vc)
    })

    it('uploads a self-signed profile to ipfs if none is configured or provided', async function() {
      this.timeout(20000) // could take a while
      const uport = new Connect('test app', {description: 'It tests'})
      
      const jwt = {
        name: 'test app',
        description: 'It tests',
        url: 'http://localhost:9876'
      }

      await uport.signAndUploadProfile()
      expect(uport.vc[0]).to.match(/^\/ipfs\//)
      return new Promise((resolve, reject) => {
        ipfs.cat(uport.vc[0].replace(/^\/ipfs\//, ''), (err, res) => {
          if (err) reject(err)
          const { payload } = decodeJWT(res)
          expect(payload.sub).to.equal(uport.keypair.did)
          const profile = payload.claim
          expect(profile.name).to.equal(jwt.name)
          expect(profile.description).to.equal(jwt.description)
          expect(profile.url).to.equal(jwt.url)
          resolve()
        }) 
      })
    })
  })
  /*********************************************************************/

  describe('getProvider', () => {

    const addressTest = '0xab6c9051b9a1eg1abc1250f8b0640848c8ebfcg6'

    // NOTE: provider test coverage in uport-transports
    it('returns a provider with same network settings as connect', () => {
      const netConfig = { id: '0x5', registry: '0xab6c9051b9a1eg1abc1250f8b0640848c8ebfcg6', rpcUrl: 'https://somenet.io' }
      const uport = new Connect('test app', {network: netConfig})
      const provider = uport.getProvider()
      expect(uport.network.rpcUrl, 'uport.network.rpcUrl').to.equal(provider.provider.host)
    })

    it('returns provider which calls connect.requestDisclosure on getCoinbase', (done) => {
      const uport = new Connect('test app')
      const mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      const addressTest = '0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e'
      const verifyResponse = sinon.stub().resolves({'name': 'uPort Demo', '@type': 'App', 'description': 'Demo App', 'url': 'demo.uport.me', did: `did:uport:${mnid}`, mnid, address: addressTest})
      uport.verifyResponse = verifyResponse

      // uport.requestDisclosure = sinon.stub()
      const web3 = new Web3(uport.getProvider())
      web3.eth.getCoinbase((error, address) => {
        expect(uport.verifyResponse).to.be.called
        if (error) console.log(error)
        expect(address).to.equal(addressTest)
        done()
      })

      // Fake response
      const resId = 'addressReqProvider'
      const res = { id: resId, payload: resJWT, data: '' }
      uport.pubResponse(res)
    })

    it('returns provider which calls connect.txRequest on transaction calls', () => {
      const uport = new Connect('testApp')
      const txHashTest = '0x00521965e7bd230323c423d96c657db5b79d099f'
      uport.sendTransaction = sinon.stub()
      const web3 = new Web3(uport.getProvider())
      web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087' //TODO anything to do about this?

      //TODO Move abit to test data
      const abi = [{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]
      const StatusContract =  web3.eth.contract(abi).at('0x00521965e7bd230323c423d96c657db5b79d099f')

      StatusContract.updateStatus('hello', (err, txHash) => {
        expect(txHash).to.equal(txHashTest)
        expect(uport.sendTransaction).to.be.called
        done()
      })
      // Fake response
      const resId = 'txReqProvider'
      const res = { id: resId, payload: txHashTest, data: '' }
      uport.PubSub.publish(resId, res)
    })

    it('sets the address of provider when returned if already available', () => {
      const uport = new Connect('testApp')

      uport.mnid = '2ocuXMaz4pJPtzkbqeaAeJUvGRdVGm2MJth'
      const provider = uport.getProvider()
      expect(provider.address).to.equal(uport.address)
    })
  })

  /*********************************************************************/

  describe('onResponse', () => {
    const id = 'test'
    const JWTParse = {'name': 'uPort Demo', '@type': 'App', 'description': 'Demo App', 'url': 'demo.uport.me', 'address': '0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e', 'did': 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG' }
    const did = 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
    const JWTReq = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpYXQiOjE1MjcxODM0ODcsImV4cCI6MTUyNzE4NDA4NywicmVxdWVzdGVkIjpbIm5hbWUiLCJwaG9uZSIsImNvdW50cnkiXSwicGVybWlzc2lvbnMiOlsibm90aWZpY2F0aW9ucyJdLCJjYWxsYmFjayI6Imh0dHBzOi8vY2hhc3F1aS51cG9ydC5tZS9hcGkvdjEvdG9waWMvS3JzRkxnSDFQa3RwOGZ0eSIsInR5cGUiOiJzaGFyZVJlcSIsImlzcyI6ImRpZDp1cG9ydDoyb2VYdWZIR0RwVTUxYmZLQnNaRGR1N0plOXdlSjNyN3NWRyJ9.bJC2dWT0tCdFOeC0JlN_Dx9PwyI18wtVHz2MOp-9I7QPNhgA8SlbqdqJiMrmZfc1PdM3AjNVD31HmuDoQYQMNQ'

    it('resolves once a response with given id available from pub', (done) => {
      const response = { payload: 'test', data: ''}
      const uport = new Connect('testApp')
      uport.onResponse(id).then((res) => {
        expect(res.payload).to.equal('test')
        done()
        return
      })
      uport.PubSub.publish(id,response)
    })

    it('resolves once a response with given id available from hash change', (done) => {
      const id = 'test'
      const uport = new Connect('testApp')
      uport.onResponse(id).then((res) => {
        // TODO move to vars above
        expect(res.payload).to.equal('0x00521965e7bd230323c423d96c657db5b79d099f')
        done()
      })
      window.location.hash = `access_token=0x00521965e7bd230323c423d96c657db5b79d099f&id=test`
    })

    it('handles JWT responses, parses, validates and returns by calling verifyResponse/credentials', (done) => {
      const uport = new Connect('testApp')
      const verifyResponse = sinon.stub().resolves(JWTParse)
      uport.verifyResponse = verifyResponse
      uport.onResponse(id).then((res) => {
        expect(verifyResponse).to.be.called
        expect(res.payload).to.deep.equal(JWTParse)
        done()
      })
      window.location.hash = `access_token=${JWTReq}&id=${id}`
    })

    it('handles tx hashes response, by just returning them', (done) => {
      const uport = new Connect('testApp')
      uport.onResponse(id).then((res) => {
        expect(res.payload).to.equal('0x00521965e7bd230323c423d96c657db5b79d099f')
        done()
      })
      window.location.hash = `access_token=0x00521965e7bd230323c423d96c657db5b79d099f&id=test`
    })

    it('returns instantly if there is already a response on connect instantiation', () => {
      // Set response before connect instantiate
      window.location.hash = `access_token=0x00521965e7bd230323c423d96c657db5b79d099f&id=test`
      const uport = new Connect('testApp')
      return uport.onResponse(id).then((res) => {
        expect(res.payload).to.equal('0x00521965e7bd230323c423d96c657db5b79d099f')
        return
      })
    })

    it('it writes to local storage and instance (did, ...) if values already not available', (done) => {
      const uport = new Connect('testApp')
      uport.verifyResponse = sinon.stub().resolves(JWTParse)
      uport.onResponse(id).then((res) => {
        expect(uport.did).to.equal(did)
        const connectState = window.localStorage.getItem('connectState')
        expect(new RegExp(`${did}`).test(connectState)).to.be.true
        done()
      })
      window.location.hash = `access_token=${JWTReq}&id=${id}`
    })

    it('sets pushToken and publicEncKey if available, and saves them to localStorage', (done) => {
      const uport = new Connect('testApp')
      const response = {pushToken: 'push token', boxPub: 'public key', did: 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG', mnid:'2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'}
      uport.verifyResponse = sinon.stub().resolves(response)
      expect(uport.pushTransport).to.equal(undefined)
      expect(uport.pushToken).to.be.falsey
      expect(uport.publicEncKey).to.falsey

      uport.onResponse(id).then((res) => {
        expect(uport.pushToken).to.equal(response.pushToken)
        expect(uport.publicEncKey).to.equal(response.boxPub)
        expect(uport.pushTransport).to.be.a('function')

        // Instantiate a new connect instance to test persistance
        const uportFromLocalStorage = new Connect('testApp2')
        expect(uportFromLocalStorage.pushToken).to.equal(response.pushToken)
        expect(uportFromLocalStorage.publicEncKey).to.equal(response.boxPub)
        expect(uportFromLocalStorage.pushTransport).to.be.a('function')
        done()
      }).catch(console.log)

      uport.PubSub.publish(id, {payload: resJWT})
    })

    it('rejects if pubsub payload has an error', (done) => {
      const uport = new Connect('testApp')

      uport.onResponse('errorId').then(null, (err) => {
        expect(err.error).to.equal('bad')
        done()
      })

      uport.PubSub.publish('errorId', {error: 'bad'})
    })

    it('rejects if the JWT is not validated', (done) => {
      const uport = new Connect('testApp')

      uport.verifyResponse = sinon.stub().rejects()
      uport.onResponse('id').then(null, (err) => {
        expect(!!err).to.be.true
        done()
      })

      uport.PubSub.publish('id', {payload: resJWT})
    })
  })

  /*********************************************************************/

  describe('send', () => {
    it('calls mobile transport if on mobile client', () => {
      const mobileTransport = sinon.stub().callsFake(() => new Promise((resolve)=> resolve()))
      const uport = new Connect('testApp', { mobileTransport, isMobile: true})
      uport.send('uri', 'id')
      expect(mobileTransport).to.be.called
      expect(mobileTransport).to.be.calledWith('uri')
    })

    it('calls transport if on desktop client', () => {
      const transport = sinon.stub().callsFake(() => new Promise((resolve)=> resolve('test')))
      const uport = new Connect('testapp', { transport, isMobile: false})
      uport.send('uri', 'id')
      expect(transport).to.be.called
      expect(transport).to.be.calledWith('uri')
    })

    it('uses pushTransport if available and usePush is true', () => {
      const transport = sinon.stub().resolves()
      const pushTransport = sinon.stub().resolves()
      const uport = new Connect('test app', {transport, usePush: false})
      uport.pushTransport = pushTransport

      uport.send('fake uri', 'fake id')
      expect(pushTransport).not.to.be.called
      expect(transport).to.be.calledOnce

      uport.usePush = true
      uport.send('fake uri', 'fake id')
      expect(pushTransport).to.be.calledOnce
      expect(pushTransport).to.be.calledWith('fake uri')
    })

    it('requires a request id, throws error if none', () => {
      const uport = new Connect('testapp')
      expect(() => uport.send()).to.throw
    })

    it('on desktop client it publishes response to subscriber once returned', (done) => {
      const transport = sinon.stub().resolves('test')
      const uport = new Connect('testapp', { transport, isMobile: false})
      // Check if publish func called, by subsribing to event
      uport.PubSub.subscribe('topic', (msg, res) => {
        expect(res).to.equal('test')
        done()
      })
      uport.send('request', 'topic')
    })

    it('publishes response to subscriber once returned when using pushTransport', (done) => {
      const pushTransport = sinon.stub().resolves('test')
      const uport = new Connect('testapp', {isMobile: false})
      uport.pushTransport = pushTransport
      uport.PubSub.subscribe('topic', (msg, res) => {
        expect(res).to.equal('test')
        done()
      })
      uport.send('request', 'topic')
    })
  })

  /*********************************************************************/

  describe('sendVerification', () => {
    const vc = ['fake']
    it('Creates a JWT signed by the configured keypair', (done) => {
      const uport = new Connect('testApp', {vc})
      const cred = {
        claim: { hello: 'world' },
        sub: 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      }

      uport.send = (url) => {
        const jwt = message.util.getURLJWT(url)

        verifyJWT(jwt, {audience: uport.keypair.did}).then(({payload, issuer}) => {
          expect(issuer).to.equal(uport.keypair.did)
          expect(payload.claim).to.deep.equal(cred.claim)
          done()
        })
      }

      uport.sendVerification(cred)
    })
  })

  /*********************************************************************/

  describe('requestVerificationSignature', () => {
    const vc = ['fake']
    it('Creates a verification signature request signed by the configured keypair', (done) => {
      const uport = new Connect('testApp', {vc})
      const unsignedClaim = { hello: 'world' }
      const sub = 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'

      uport.send = (jwt) => {
        verifyJWT(jwt, {audience: uport.keypair.did}).then(({payload, issuer}) => {
          expect(issuer).to.equal(uport.keypair.did)
          expect(payload.unsignedClaim).to.deep.equal(unsignedClaim)
          done()
        })
      }

      uport.requestVerificationSignature(unsignedClaim, sub)
    })
  })

  describe('requestTypedDataSignature', () => {
    const vc = ['fake']
    it('creates a typed data signature request signed by the configured keypair', (done) => {
      const uport = new Connect('testApp', {vc})
      const typedData = {
        types: {
          EIP712Domain: [
            {name: 'name', type: 'string'},
            {name: 'version', type: 'string'},
            {name: 'chainId', type: 'uint256'},
            {name: 'verifyingContract', type: 'address'},
            {name: 'salt', type: 'bytes32'}
          ],
          Greeting: [
            {name: 'text', type: 'string'},
            {name: 'subject', type: 'string'},
          ]
        },
        domain: {
          name: 'My dapp', 
          version: '1.0', 
          chainId: 1, 
          verifyingContract: '0xdeadbeef',
          salt: '0x999999999910101010101010'
        },
        primaryType: 'Greeting',
        message: {
          text: 'Hello',
          subject: 'World'
        }
      } 

      const testId = 'test_signTypedData'
      const opts = {data: 'woop', type: 'woop', cancel: 'woop'}
    
      uport.send = (jwt, id, sendOpts) => {
        verifyJWT(jwt, {audience: uport.keypair.did}).then(({payload, issuer}) => {
          expect(issuer).to.equal(uport.keypair.did)
          expect(payload.typedData).to.deep.equal(typedData)
          expect(id).to.equal(testId)
          expect(sendOpts).to.equal(opts)
          done()
        })
      }

      uport.requestTypedDataSignature(typedData, testId, opts)
    })

    it('is called with the correct arguments from a UportSubprovider', (done) => {
      const uport = new Connect('test app', {vc})
      const subprovider = uport.getProvider()

      // Test that the request/response pair is the same
      let reqId
      uport.requestTypedDataSignature = (_, id) => reqId = id
      uport.onResponse = (id) => {
        expect(id).to.equal(reqId)
        return Promise.resolve({payload: 'result'})
      }

      const payload = {method: 'eth_signTypedData', id: 'test', params: []}
      subprovider.sendAsync(payload, (err, {id, jsonrpc, result}) => {
        expect(err).to.be.null
        expect(id).to.equal(payload.id)
        expect(jsonrpc).to.equal('2.0')
        expect(result).to.equal('result')
        done()
      })
    })
  })

  describe('requestPersonalSign', () => {
    const vc = ['fake']

    it('calls credentials.createPersonalSignRequest with the correct args', (done) => {
      const uport = new Connect('test app', {vc})
      const opts = {test: 'test'}
      const id = 'testid'
      const data = 'deadbeef'
      uport.credentials.createPersonalSignRequest = (testData, {riss, callback}) => {
        expect(riss).to.equal(uport.did)
        expect(callback).to.match(/\/topic\//)
        expect(testData).to.equal(data)
        return Promise.resolve('jwt')
      }

      uport.send = (jwt, testId, sendOpts) => {
        expect(jwt).to.equal('jwt')
        expect(sendOpts).to.equal(opts)
        expect(testId).to.equal(id)
        done()
      }

      uport.requestPersonalSign(data, id, opts)
    })

    it('formats Buffer as hex string', (done) => {
      const uport = new Connect('test app', {vc})
      const opts = {test: 'test'}
      const id = 'testid'
      const data = Buffer.from([0xde, 0xad, 0xbe, 0xef])
      uport.did = 'test'
      
      uport.credentials.createPersonalSignRequest = (testData, {riss, callback}) => {
        expect(riss).to.equal(uport.did)
        expect(callback).to.match(/\/topic\//)
        expect(testData).to.equal('deadbeef')
        return Promise.resolve('jwt')
      }

      uport.send = (jwt, testId, sendOpts) => {
        expect(jwt).to.equal('jwt')
        expect(sendOpts).to.equal(opts)
        expect(testId).to.equal(id)
        done()
      }

      uport.requestPersonalSign(data, id, opts)
    })

    it('is called with the correct arguments from UportSubprovider', () => {
      const uport = new Connect('test app', {vc})
      const subprovider = uport.getProvider()

      // Test that the request/response pair is the same
      let reqId
      uport.requestPersonalSign = (_, id) => reqId = id
      uport.onResponse = (id) => {
        expect(id).to.equal(reqId)
        return Promise.resolve({payload: 'result'})
      }

      const payload = {method: 'personal_sign', id: 'test', params: []}
      subprovider.sendAsync(payload, (err, {id, jsonrpc, result}) => {
        expect(err).to.be.null
        expect(id).to.equal(payload.id)
        expect(jsonrpc).to.equal('2.0')
        expect(result).to.equal('result')
        done()
      })
    })
  })

  /*********************************************************************/

  describe('contract', () => {
    // NOTE: most unit test are in uport-js/core
    it('returns contract object with txobj handler (sendTransaction) and abi configured', () => {
      const uport = new Connect('testapp')
      const sendTransaction = sinon.spy()
      uport.sendTransaction = sendTransaction
      const abi = [{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]
      const Contract = uport.contract(abi).at('0x00521965e7bd230323c423d96c657db5b79d099f')
      expect(Contract.abi).to.deep.equal(abi)
      // sendTransaction configured as TxObj handler if called on function call
      Contract.updateStatus('hello')
      expect(sendTransaction).to.be.called
    })
  })

  /*********************************************************************/

  describe('sendTransaction', () => {
    const txObj = {to: "2ooE3vLGYi9vHmfYSc3ZxABfN5p8756sgi6", function: "updateStatus(string 'hello')"}
    const txObjAddress = {to: '0x71845bbfe5ddfdb919e780febfff5eda62a30fdc', function: "updateStatus(string 'hello')"}
    const vc = ['fake']
    it('call send with request uri including transaction jwt', (done) => {
      const send = (uri) => {
        const jwt = getURLJWT(uri)
        expect(isJWT(jwt)).to.be.true
        done()
      }
      const uport = new Connect('testApp', {vc})
      uport.send = send
      uport.sendTransaction(txObj)
    })

    it('encodes transaction address as mnid with network id if not mnid', (done) => {
      const send = (uri) => {
        const jwt = getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(decoded.payload.to).to.equal('2ooE3vLGYi9vHmfYSc3ZxABfN5p8756sgi6')
        done()
      }
      const uport = new Connect('testApp', {vc})
      uport.send = send
      uport.sendTransaction(txObjAddress)
    })

    it('sets chasqui as callback if not on mobile', (done) => {
        const send = (uri) => {
          const jwt = message.util.getURLJWT(uri)
          const decoded = decodeJWT(jwt)
          expect(/chasqui/.test(decoded.payload.callback)).to.be.true
          done()
        }
        const uport = new Connect('testApp', {vc})
        uport.send = send
        uport.sendTransaction(txObj)
    })

    it('sets this window as callback if on mobile', () => {
      const send = (uri) => {
        const jwt = message.util.getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(/localhost/.test(decoded.payload.callback)).to.be.true
        done()
      }
      const uport = new Connect('testApp', {isMobile: true, vc})
      uport.send = send
      uport.sendTransaction(txObj)
    })
  })

/*********************************************************************/

describe('transports', () => {
  const data = {hello: 'world'}

  it('connectTransport resolves immediately if not using chasqui', (done) => {
    const uport = new Connect('testApp')
    uport.transport(resJWT, {data}).then(res => {
      expect(res.data).to.equal(data)
      done()
    })
  })

  it('pushTransport resolves immediately if not using chasqui', (done) => {
    const dummy = new Connect('dumb')
    dummy.pushToken = 'push token'
    dummy.publicEncKey = 'public key'
    dummy.setState()
    // This one has pushTransport set
    const uport = new Connect('testApp')
    uport.pushTransport(resJWT, {data}).then(res => {
      expect(res.data).to.equal(data)
      done()
    })
  })

  it('uses universal links on first mobile request, and deep links thereafter', (done) => {
    // Set up uriHandler to check uri scheme
    let shouldBeDeeplink = false
    const mobileUriHandler = (uri) => {
      if (shouldBeDeeplink) {
        expect(uri).to.match(/me\.uport:/)
      } else {
        expect(uri).to.match(/id\.uport\.me/)
      } 
    }

    const uport = new Connect('testapp', { mobileUriHandler })
    // useDeepLinks is unset initially
    expect(uport.useDeeplinks).to.be.undefined
  
    // Check that the flag is switched after a response is handled
    uport.pubResponse = () => {
      expect(uport.useDeeplinks).to.be.true
      uport.mobileTransport('fakeDeeplink')
      done()
    }

    uport.mobileTransport('fakeUniversal')
    // url.listenResponse is fired on hash change
    window.location.hash = `access_token=0x00521965e7bd230323c423d96c657db5b79d099f&id=test`
    shouldBeDeeplink = true
  })
})

  /*********************************************************************/

  describe('connect state', () => {
    it('Ensures agreement between mnid and address', () => {
      const uport = new Connect('testApp')
      uport.mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      expect(uport.address).to.equal('0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e')
      const uport2 = new Connect('testApp')
      uport.address = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      expect(uport.mnid).to.equal('2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG')
      expect(uport.address).to.equal('0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e')
    })

    it('Throws an error when setting address without an mnid', () => {
      const uport = new Connect('testApp')
      expect(() => uport.address = '0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e').to.throw
    })

    it('Saves to localStorage on assignment to state properties', () => {
      const uport = new Connect('testApp')

      uport.did = 'WOOPITY'

      const uport2 = new Connect('testApp2')
      expect(uport2.did).to.equal('WOOPITY')
    })

    it('returns string representing all persistant state of connect obj', () => {
      const uport = new Connect('testapp')
      // uport.address = '0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e'
      uport.mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uport.doc = {name: 'Ran'}
      uport.did = 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uport.keypair = {did: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54' , keypair: '1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d'}
      uport.publicEncKey = 'test public key'
      uport.pushToken = 'test push token'
      const uportStateString = JSON.stringify(uport.state)

      expect(uportStateString).to.be.a('string')
      expect(/0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e/.test(uportStateString)).to.be.true
      expect(/2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG/.test(uportStateString)).to.be.true
      expect(/test public key/.test(uportStateString)).to.be.true
      expect(/test push token/.test(uportStateString)).to.be.true
      expect(/Ran/.test(uportStateString)).to.be.true
      expect(/did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54/.test(uportStateString)).to.be.true
      expect(/1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d/.test(uportStateString)).to.be.true
    })

    it('sets all persitant state of connect object given serialized string of state', () => {
      const uportTest = new Connect('testapp')
      // uportTest.address = '0x00521965e7bd230323c423d96c657db5b79d099f'
      uportTest.mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uportTest.doc = {name: 'Ran'}
      uportTest.did = 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uportTest.keypair = {did: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54' , keypair: '1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d'}
      uportTest.publicEncKey = 'test public key'
      uportTest.pushToken = 'test push token'

      const uport = new Connect('testapp')
      uport.setState(uportTest.loadState())

      expect(uport.address).to.equal(uportTest.address)
      expect(uport.mnid).to.equal(uportTest.mnid)
      expect(uport.doc).to.deep.equal(uportTest.doc)
      expect(uport.did).to.equal(uportTest.did)
      expect(uport.keypair).to.deep.equal(uportTest.keypair)
      expect(uport.pushToken).to.equal(uportTest.pushToken)
      expect(uport.publicEncKey).to.equal(uportTest.publicEncKey)
    })

    const testState = {
      address: '0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e',
      mnid: '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG',
      doc: {name: 'Ran'},
      did: 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG',
      publicEncKey: 'test public key',
      pushToken: 'test push token',
      keypair: {did: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54' , keypair: '1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d'}
    }

    const logoutState = {
      keypair: {did: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54' , keypair: '1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d'}
    }

    it('clears all state except for keypair on logout', () => {
      const uport = new Connect('testApp')

      uport.setState(testState)

      expect(uport.state).to.deep.equal(testState)
      expect(uport.pushTransport).to.be.a('function')

      uport.logout()
      expect(uport.state).to.deep.equal(logoutState)
      expect(uport.pushTransport).to.be.falsey
    })

    it('clears all state including keypair on reset ', () => {
      const uport = new Connect('testApp')

      uport.setState(testState)
      expect(uport.state).to.deep.equal(testState)
      expect(uport.pushTransport).to.be.a('function')
      const oldCredentials = uport.credentials

      uport.reset()

      expect(uport.did).to.be.falsey
      expect(uport.pushTransport).to.be.falsey
      expect(uport.credentials).not.to.equal(oldCredentials)
      expect(uport.credentials).not.to.deep.equal(oldCredentials)
    })
  })
})

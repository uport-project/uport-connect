import chai, { expect, assert } from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import Web3 from 'web3'

import { Connect } from './uport-connect.js'
import { message } from 'uport-transports'
import { Credentials } from 'uport'
import { decodeJWT, verifyJWT } from 'did-jwt'

chai.use(sinonChai)

// TODO import from messages after
const isJWT = (jwt) => /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/.test(jwt)
const getURLJWT = (url) => url.replace(/https:\/\/id.uport.me\/req\//, '').replace(/(\#|\?)(.*)/, '')

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
      expect(uport.storage).to.be.true
    })

    it('sets config vals if given config object', () => {
      const transport = sinon.stub()
      const mobileTransport = sinon.stub()
      const config = {
        network: 'mainnet',
        // provider: new HttpProvider(this.network.rpcUrl),
        accountType: 'keypair',
        isMobile: true,
        storage: false,
        transport,
        mobileTransport
      }
      const uport = new Connect('test app', config)
      expect(uport.network.id).to.equal('0x1')
      expect(uport.accountType).to.equal('keypair')
      expect(uport.isOnMobile).to.be.true
      expect(uport.storage).to.be.false
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
    it('creates a request uri ', (done) => {
      const transport = (uri, opts) => new Promise((resolve, reject) => {
        const jwt = getURLJWT(uri)
        expect(isJWT(jwt)).to.be.true
        done()
      })
      const uport = new Connect('testApp', {transport})
      uport.requestDisclosure({})
    })

    it('creates a JWT signed by keypair', (done) => {
      const transport = (uri, opts) => new Promise((resolve, reject) => {
        const jwt = message.util.getURLJWT(uri)
        expect(isJWT(jwt)).to.be.true
        const decoded = decodeJWT(jwt)
        expect(decoded.payload.iss).is.equal(uport.keypair.did)
        resolve('test')
        done()
      })
      const uport = new Connect('testApp', { transport })
      uport.requestDisclosure({})
    })

    it('sets chasqui as callback if not on mobile', () => {
      const transport = (uri, opts) => new Promise((resolve, reject) => {
        const jwt = message.util.getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(/chasqui/.test(decoded.payload.callback)).to.be.true
        resolve('test')
        done()
      })
      const uport = new Connect('testApp', {transport})
      uport.requestDisclosure({})
    })

    it('sets this window as callback if on mobile', (done) => {
      const mobileTransport = (uri, opts) => {
        const jwt = message.util.getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(/localhost/.test(decoded.payload.callback)).to.be.true
        done()
      }
      const uport = new Connect('testApp', {mobileTransport, isMobile: true})
      uport.requestDisclosure({})
    })

    it('calls request with request uri and id', (done) => {
      const request = (uri, id) => {
        expect(/eyJ0eXA/.test(uri)).to.be.true
        expect(!!id).to.be.true
        done()
      }
      const uport = new Connect('testApp')
      uport.request = request
      uport.requestDisclosure({})
    })

    it('sets the accountType to none if not provided', (done) => {
      const uport = new Connect('test app none')
      uport.genCallback = sinon.stub()
      uport.request = sinon.stub()
      uport.credentials.requestDisclosure = (req) => {
        expect(req.accountType).to.equal('none')
        done()
      }

      uport.requestDisclosure({})
    })

    it('sets the accountType to configured default if not provided in request', (done) => {
      const accountType = 'keypair'
      const uport = new Connect('test app keypair', {accountType})
      uport.genCallback = sinon.stub()
      uport.request = sinon.stub()
      uport.credentials.requestDisclosure = (req) => {
        expect(req.accountType).to.equal(accountType)
        done()
      }

      uport.requestDisclosure({})
    })

    it('uses the accountType provided in request', (done) => {
      const configAccountType = 'keypair'
      const accountType = 'general'
      const uport = new Connect('test app', {accountType: configAccountType})
      uport.genCallback = sinon.stub()

      uport.credentials.requestDisclosure = (req) => {
        expect(req.accountType).to.equal(accountType)
        done()
      }

      uport.requestDisclosure({accountType})
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
      const verifyResponse = sinon.stub().resolves({'name': 'uPort Demo', '@type': 'App', 'description': 'Demo App', 'url': 'demo.uport.me', did: `did:uport:${mnid}`, mnid})
      uport.verifyResponse = verifyResponse

      // uport.requestDisclosure = sinon.stub()
      const web3 = new Web3(uport.getProvider())
      web3.eth.getCoinbase((error, address) => {
        expect(uport.verifyResponse).to.be.called
        // TODO test with full test example and fix
        // if (error) console.log(error)
        // expect(address).to.equal(addressTest)
        done()
      })

      // Fake response
      const resId = 'addressReqProvider'
      const res = { id: resId, res: resJWT, data: '' }
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
      const res = { id: resId, res: txHashTest, data: '' }
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
      const response = { res: 'test', data: ''}
      const uport = new Connect('testApp')
      uport.onResponse(id).then((res) => {
        expect(res.res).to.equal('test')
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
        expect(res.res).to.equal('0x00521965e7bd230323c423d96c657db5b79d099f')
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
        expect(res.res).to.deep.equal(JWTParse)
        done()
      })
      window.location.hash = `access_token=${JWTReq}&id=${id}`
    })

    it('handles tx hashes response, by just returning them', (done) => {
      const uport = new Connect('testApp')
      uport.onResponse(id).then((res) => {
        expect(res.res).to.equal('0x00521965e7bd230323c423d96c657db5b79d099f')
        done()
      })
      window.location.hash = `access_token=0x00521965e7bd230323c423d96c657db5b79d099f&id=test`
    })

    it('returns instantly if there is already a response on connect instantiation', () => {
      // Set response before connect instantiate
      window.location.hash = `access_token=0x00521965e7bd230323c423d96c657db5b79d099f&id=test`
      const uport = new Connect('testApp')
      return uport.onResponse(id).then((res) => {
        expect(res.res).to.equal('0x00521965e7bd230323c423d96c657db5b79d099f')
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
      expect(uport.pushToken).to.equal(undefined)
      expect(uport.publicEncKey).to.equal(undefined)

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

      uport.PubSub.publish(id, {res: resJWT})
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

      uport.PubSub.publish('id', {res: resJWT})
    })
  })

  /*********************************************************************/

  describe('request', () => {
    it('calls mobile transport if on mobile client', () => {
      const mobileTransport = sinon.stub().callsFake(() => new Promise((resolve)=> resolve()))
      const uport = new Connect('testApp', { mobileTransport, isMobile: true})
      uport.request('uri', 'id')
      expect(mobileTransport).to.be.called
      expect(mobileTransport).to.be.calledWith('uri')
    })

    it('calls transport if on desktop client', () => {
      const transport = sinon.stub().callsFake(() => new Promise((resolve)=> resolve('test')))
      const uport = new Connect('testapp', { transport, isMobile: false})
      uport.request('uri', 'id')
      expect(transport).to.be.called
      expect(transport).to.be.calledWith('uri')
    })

    it('uses pushTransport if available and usePush is true', () => {
      const transport = sinon.stub().resolves()
      const pushTransport = sinon.stub().resolves()
      const uport = new Connect('test app', {transport, usePush: false})
      uport.pushTransport = pushTransport

      uport.request('fake uri', 'fake id')
      expect(pushTransport).not.to.be.called
      expect(transport).to.be.calledOnce

      uport.usePush = true
      uport.request('fake uri', 'fake id')
      expect(pushTransport).to.be.calledOnce
      expect(pushTransport).to.be.calledWith('fake uri')
    })

    it('requires a request id, throws error if none', () => {
      const uport = new Connect('testapp')
      expect(() => uport.request()).to.throw
    })

    it('on desktop client it publishes response to subscriber once returned', (done) => {
      const transport = sinon.stub().resolves('test')
      const uport = new Connect('testapp', { transport, isMobile: false})
      // Check if publish func called, by subsribing to event
      uport.PubSub.subscribe('topic', (msg, res) => {
        expect(res).to.equal('test')
        done()
      })
      uport.request('request', 'topic')
    })

    it('publishes response to subscriber once returned when using pushTransport', (done) => {
      const pushTransport = sinon.stub().resolves('test')
      const uport = new Connect('testapp', {isMobile: false})
      uport.pushTransport = pushTransport
      uport.PubSub.subscribe('topic', (msg, res) => {
        expect(res).to.equal('test')
        done()
      })
      uport.request('request', 'topic')
    })
  })

  /*********************************************************************/

  describe('attest', () => {
    it('Creates a JWT signed by the configured keypair', (done) => {
      const uport = new Connect('testApp')
      const cred = {
        claim: { hello: 'world' },
        sub: 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      }

      uport.request = (jwt) => {
        verifyJWT(jwt, {audience: uport.keypair.did}).then(({payload, issuer}) => {
          expect(issuer).to.equal(uport.keypair.did)
          expect(payload.claim).to.deep.equal(cred.claim)
          done()
        })
      }

      uport.attest(cred)
    })
  })

  /*********************************************************************/

  describe('createVerificationRequest', () => {
    it('Creates a JWT signed by the configured keypair', (done) => {
      const uport = new Connect('testApp')
      const cred = {
        unsignedClaim: { hello: 'world' },
        sub: 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      }

      uport.request = (jwt) => {
        verifyJWT(jwt, {audience: uport.keypair.did}).then(({payload, issuer}) => {
          expect(issuer).to.equal(uport.keypair.did)
          expect(payload.unsignedClaim).to.deep.equal(cred.unsignedClaim)
          done()
        })
      }

      uport.createVerificationRequest(cred)
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

    it('call request with request uri including transaction jwt', (done) => {
      const request = (uri) => {
        const jwt = getURLJWT(uri)
        expect(isJWT(jwt)).to.be.true
        done()
      }
      const uport = new Connect('testApp')
      uport.request = request
      uport.sendTransaction(txObj)
    })

    it('encodes transaction address as mnid with network id if not mnid', (done) => {
      const request = (uri) => {
        const jwt = getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(decoded.payload.to).to.equal('2ooE3vLGYi9vHmfYSc3ZxABfN5p8756sgi6')
        done()
      }
      const uport = new Connect('testApp')
      uport.request = request
      uport.sendTransaction(txObjAddress)
    })

    it('sets chasqui as callback if not on mobile', (done) => {
        const request = (uri) => {
          const jwt = message.util.getURLJWT(uri)
          const decoded = decodeJWT(jwt)
          expect(/chasqui/.test(decoded.payload.callback)).to.be.true
          done()
        }
        const uport = new Connect('testApp')
        uport.request = request
        uport.sendTransaction(txObj)
    })

    it('sets this window as callback if on mobile', () => {
      const request = (uri) => {
        const jwt = message.util.getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(/localhost/.test(decoded.payload.callback)).to.be.true
        done()
      }
      const uport = new Connect('testApp', {isMobile: true})
      uport.request = request
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
      const uportStateString = uport.getState()

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
      uport.setState(uportTest.getState())

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
      address: null,
      mnid: null,
      doc: null,
      did: null,
      publicEncKey: null,
      pushToken: null,
      keypair: {did: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54' , keypair: '1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d'}
    }

    it('clears all state except for keypair on logout', () => {
      const uport = new Connect('testApp')

      uport.setState(testState)

      expect(JSON.parse(uport.getState())).to.deep.equal(testState)
      expect(uport.pushTransport).to.be.a('function')

      uport.logout()
      expect(JSON.parse(uport.getState())).to.deep.equal(logoutState)
      expect(uport.pushTransport).to.be.null
    })

    it('clears all state including keypair on reset ', () => {
      const uport = new Connect('testApp')

      uport.setState(testState)
      expect(JSON.parse(uport.getState())).to.deep.equal(testState)
      expect(uport.pushTransport).to.be.a('function')
      const oldCredentials = uport.credentials

      uport.reset()

      expect(uport.did).to.be.null
      expect(uport.pushTransport).to.be.null
      expect(uport.credentials).not.to.equal(oldCredentials)
      expect(uport.credentials).not.to.deep.equal(oldCredentials)
    })
  })
})

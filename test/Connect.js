// import { expect, assert} from 'chai'
import { Connect } from './uport-connect.js'
const sinon = require('sinon')
var chai = require('chai');
const expect = chai.expect
chai.use(require('sinon-chai'))
import { Credentials } from 'uport'
import Web3 from 'web3'
import { message } from 'uport-core'
import { decodeJWT } from 'did-jwt'

// TODO import from messages after
const isJWT = (jwt) => /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/.test(jwt)
const getURLJWT = (url) => url.replace(/https:\/\/id.uport.me\/req\//, '').replace(/(\#|\?)(.*)/, '')

describe('Connect', () => {

  beforeEach(()=>{
    window.localStorage.clear()
  })

  describe('constructor', () => {
    it('sets defaults', () => {
      const uport = new Connect('test app')
      expect(uport.appName).to.equal('test app')
      expect(uport.network.id).to.equal('0x4')
      // expect(uport.accountType).to.equal('') TODO What will be the default?
      expect(uport.transport).to.be.a('function')
      expect(uport.mobileTransport).to.be.a('function')
      expect(uport.onloadResponse).to.be.a('function')
      expect(uport.isOnMobile).to.be.a('boolean')
      expect(uport.storage).to.be.true
    })

    it('sets config vals if given config object', () => {
      const transport = sinon.stub()
      const mobileTransport = sinon.stub()
      const config ={
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
      expect(mobileTransport).to.be.calledOnce
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

    it('initializes with address/did from local storage if available', () => {
      // TODO
      // Set some storage
      const uportSetStorage = new Connect('test app')
      const address = "0x60fa1309b60125e97f2e8fd2ec576be1932ee51a"
      const did = "did:ethr:0x60fa1309b60125e97f2e8fd2ec576be1932ee51a"
      // TODO update and test other vals
      uportSetStorage.mnid = did
      uportSetStorage.setState()
      // Test if re-initialized with storage
      const uport = new Connect('testApp')
      expect(uport.mnid).to.equal(did)
    })

  })

  describe('getProvider', () => {

      const addressTest = '0xab6c9051b9a1eg1abc1250f8b0640848c8ebfcg6'

      // NOTE: provider test coverage in uport-core-js
      it('returns a provider with same network settings as connect', () => {
      const netConfig = { id: '0x5', registry: '0xab6c9051b9a1eg1abc1250f8b0640848c8ebfcg6', rpcUrl: 'https://somenet.io' }
      const uport = new Connect('test app', {network: netConfig})
      const provider = uport.getProvider()
      expect(uport.network.rpcUrl, 'uport.network.rpcUrl').to.equal(provider.provider.host)
      })

    it('returns provider which calls connect.requestAddress on getCoinbase', (done) => {
      const uport = new Connect('test app')
      const mnid = '2nQtiQG6Cgm1GYTBaaKAgr76uY7iSexUkqX'
      const addressTest = '0x00521965e7bd230323c423d96c657db5b79d099f'
      uport.requestAddress = sinon.stub()
      const web3 = new Web3(uport.getProvider())
      web3.eth.getCoinbase((error, address) => {
        expect(address).to.equal(addressTest)
        expect(uport.requestAddress).to.be.called
        done()
      })
      // Fake response
      const resId = 'addressReqProvider'
      const res = { id: resId, res: { payload: { nad: mnid } }, data: '' }
      uport.PubSub.publish(resId, res)
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
      uport.address = '0x00521965e7bd230323c423d96c657db5b79d099f'
      const provider = uport.getProvider()
      expect(provider.address).to.equal(uport.address)
    })
  })

  describe('requestAddress', () => {

    it('creates a request uri ', (done) => {
      const transport = (uri, opts) => new Promise((resolve, reject) => {
        expect(/https:\/\/id\.uport\.me\/req\//.test(uri)).to.be.true
        const jwt = getURLJWT(uri)
        expect(isJWT(jwt)).to.be.true
        done()
      })
      const uport = new Connect('testApp', {transport})
      uport.requestAddress('addressReq')
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
      uport.requestAddress('addressReq')
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
      uport.requestAddress('addressReq')
    })

    it('sets this window as callback if on mobile', (done) => {
      const mobileTransport = (uri, opts) => {
        const jwt = message.util.getURLJWT(uri)
        const decoded = decodeJWT(jwt)
        expect(/localhost/.test(decoded.payload.callback)).to.be.true
        done()
      }
      const uport = new Connect('testApp', {mobileTransport, isMobile: true})
      uport.requestAddress('addressReq')
    })

    it('calls request with request uri and id', (done) => {
      const request = (uri, id) => {
        expect(/https:\/\/id\.uport\.me\/req\//.test(uri)).to.be.true
        expect(!!id).to.be.true
        done()
      }
      const uport = new Connect('testApp')
      uport.request = request
      uport.requestAddress('addressReq')
    })
  })


  describe('onResponse', () => {
    const id = 'test'
    const JWTParse = {'name': 'uPort Demo', '@type': 'App', 'description': 'Demo App', 'url': 'demo.uport.me', 'address': 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'}
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
      const verifyResponse = sinon.stub().callsFake((jwt) => Promise.resolve(JWTParse))
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
      uport.verifyResponse = sinon.stub().callsFake((jwt) => Promise.resolve(JWTParse))
      uport.onResponse(id).then((res) => {
        expect(uport.did).to.equal(did)
        const connectState = window.localStorage.getItem('connectState')
        expect(new RegExp(`${did}`).test(connectState)).to.be.true
        done()
      })
      window.location.hash = `access_token=${JWTReq}&id=${id}`
    })

    // TODO test error handling
  })

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

    it('requires a request id, throws error if none', () => {
        const uport = new Connect('testapp')
        try { uport.request() } catch(err) { return }
        throw new Error('Func should have thrown')
    })

    it('on desktop client it publishes response to subscriber once returned', (done) => {
      const transport = sinon.stub().callsFake(() => new Promise((resolve)=> resolve('test')))
      const uport = new Connect('testapp', { transport, isMobile: false})
      // Check if publish func called, by subsribing to event
      uport.PubSub.subscribe('topic', (msg, res) => {
        expect(res).to.equal('test')
        done()
      })
      uport.request('request', 'topic')
    })
  })

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


  describe('sendTransaction', () => {
    const txObj = {to: "2ooE3vLGYi9vHmfYSc3ZxABfN5p8756sgi6", function: "updateStatus(string 'hello')"}
    const txObjAddress = {to: '0x71845bbfe5ddfdb919e780febfff5eda62a30fdc', function: "updateStatus(string 'hello')"}

    it('call request with request uri including transaction jwt', (done) => {
      const request = (uri) => {
        expect(/https:\/\/id\.uport\.me\/req\//.test(uri)).to.be.true
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


  describe('serialize', () => {
    it('returns string representing all persistant state of connect obj', () => {
      const uport = new Connect('testapp')
      uport.address = '0x00521965e7bd230323c423d96c657db5b79d099f'
      uport.mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uport.doc = {name: 'Ran'}
      uport.did = 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uport.firstReq = true
      uport.keypair = {did: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54' , keypair: '1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d'}
      const uportStateString = uport.serialize()
      expect(uportStateString).to.be.a('string')
      expect(/0x00521965e7bd230323c423d96c657db5b79d099f/.test(uportStateString)).to.be.true
      expect(/2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG/.test(uportStateString)).to.be.true
      expect(/Ran/.test(uportStateString)).to.be.true
      expect(/true/.test(uportStateString)).to.be.true
      expect(/did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54/.test(uportStateString)).to.be.true
      expect(/1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d/.test(uportStateString)).to.be.true
    })
  })


  describe('deserialize', () => {
    it('sets all persitant state of connect object given serialized string of state', () => {
      const uportTest = new Connect('testapp')
      uportTest.address = '0x00521965e7bd230323c423d96c657db5b79d099f'
      uportTest.mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uportTest.doc = {name: 'Ran'}
      uportTest.did = 'did:uport:2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
      uportTest.firstReq = true
      uportTest.keypair = {did: 'did:ethr:0x413daa771a2fc9c5ae5a66abd144881ef2498c54' , keypair: '1338f32fefb4db9b2deeb15d8b1b428a6346153cc43f51ace865986871dd069d'}

      const uport = new Connect('testapp')
      uport.deserialize(uportTest.serialize())

      expect(uport.address).to.equal(uportTest.address)
      expect(uport.mnid).to.equal(uportTest.mnid)
      expect(uport.doc).to.deep.equal(uportTest.doc)
      expect(uport.did).to.equal(uportTest.did)
      expect(uport.firstReq).to.equal(uportTest.firstReq)
      expect(uport.keypair).to.deep.equal(uportTest.keypair)
    })
  })

  describe('getState', () => {
    it('gets serialized state from local storage and calls deserialize with it', () => {
      const uport = new Connect('testapp')
      const deserialize = sinon.spy()
      uport.deserialize = deserialize
      // Set after connect instantiated
      window.localStorage.setItem('connectState', 'uportTestStateString')
      uport.getState()
      expect(deserialize).to.be.calledWith('uportTestStateString')
    })
  })


  describe('setState', () => {
    it('writes serialized state to local storage at connectState ', () => {
        const uport = new Connect('testapp')
        const serialize = sinon.stub().callsFake(() => 'uportTestStateString')
        uport.serialize = serialize
        uport.setState()
        expect(serialize).to.be.called
        expect(window.localStorage.getItem('connectState')).to.equal('"uportTestStateString"')
    })
  })
})

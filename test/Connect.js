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

  describe('constructor', () => {
    it('sets defaults', () => {
      const uport = new Connect('test app')
      expect(uport.appName).to.equal('test app')
      expect(uport.infuraApiKey).to.equal('test-app')
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
      window.localStorage.clear()
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
    it('resolves once a response with given id available', () => {
      // Sim hash change
    })

    it('handles JWT responses, by parsing, validating and returning', () => {
      // Sim hash change or jwt
      // sim parsing/validating?
    })

    it('handles tx hashes response, by just returning them', () => {
      // Sim tx hash
      // just return
    })

    it('returns instantly if there is already a response on page load', () => {
      // Instantiate
      // set item
      // call onload
    })

    it('it writes to local storage (mnid, doc, storage) if values already not available', () => {
      // simulate repsonse
      // check if local storage updated
    })
  })


  describe('request', () => {
    it('calls mobile transport if on mobile client', () => {
      // mobile transport spy
    })

    it('calls transport if on desktop client', () => {
      // transport spie
    })

    it('requires a request id', () => {
      // Not requst id, throws error
    })

    it('on desktop client it publishes response to subscriber once returned', () => {
      // Either spy to see if pubsub called, or set pubsub sub to see if returned
    })
  })

  describe('contract', () => {
    // NOTE: most unit test are in uport-js/core
    it('returns contract object with txobj handler and abi configured', () => {
      // Can these be checked?
    })

    it('calls sendTransaction with txobj and id on method call', () => {
      // Spy on sendtransaction, and check if called with both and id and txobj
    })
  })


  describe('sendTransaction', () => {
    it('call request with request uri including transaction jwt', () => {
    })

    it('encodes transaction address as mnid with network id', () => {
    })

    it('sets chasqui as callback if not on mobile', () => {
    })

    it('sets this window as callback if on mobile', () => {
    })

  })


  describe('serialize', () => {
    it('returns string representing all persistant state of connect obj', () => {
    })
  })


  describe('deserialize', () => {
    it('sets all persitant state of connect object given serialized string of state', () => {
    })
  })

  describe('getState', () => {
    it('gets serialized state from local storage and calls deserialize with it', () => {
    })
  })


  describe('setState', () => {
    it('writes serialized state to local storage', () => {
    })
  })
})

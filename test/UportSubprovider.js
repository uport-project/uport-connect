import SubproviderLoader from 'inject-loader!../src/UportSubprovider.js'
import HttpProvider from 'ethjs-provider-http'

import chai, { expect, assert } from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
chai.use(sinonChai)

// Mock the provider dialog from uport-transports
const ui = {
  askProvider: () => {
    return Promise.resolve({remember: true, useInjectedProvider: true})
  }
}

const {default: UportSubprovider, encodeSignature} = SubproviderLoader({
  'uport-transports/lib/transport/ui': ui
})

const network = {id: '0x4', rpcUrl: 'http://rinkeby.infura.io'}
const address = '0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e'
const mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
const badMnid = '2nSX6hxNMgvgP9MtvoJDgSjVHGRsTuxpyPi'

describe('UportSubprovider', () => {
  it('Accepts and wraps a custom provider', () => {
  	let rpcUrl = 'http://localhost:1234'
    let uSub = new UportSubprovider({provider: new HttpProvider(rpcUrl), network})

    expect(uSub.provider.host).to.equal(rpcUrl)
  })

  it('Returns an array for getAccounts', (done) => {
  	const requestAddress = sinon.stub().resolves(mnid)
  	const uSub = new UportSubprovider({requestAddress, network})

  	uSub.sendAsync({method: 'eth_accounts'}, (err, data) => {
  		expect(err).to.be.null
  		expect(data.result).to.be.a('array')
  		expect(data.result[0]).to.equal(address)
  		done()
  	})
  })

  it('Accepts valid mnids', (done) => {
  	const requestAddress = sinon.stub().resolves(mnid)
  	const uSub = new UportSubprovider({requestAddress, network})

  	uSub.getAddress((err, data) => {
  		expect(err).to.be.null
  		expect(data).to.equal(address)
  		done()
  	})
  })

  it('Rejects mnids for the wrong network', () => {
  	const requestAddress = sinon.stub().resolves(badMnid)
  	const uSub = new UportSubprovider({requestAddress, network})

  	uSub.getAddress((err, data) => {
  		expect(err).to.be.defined
  		expect(data).to.be.undefined
  		done()
  	})
  })

  it('Falls back to the underlying provider for non-handled methods', () => {
  	const uSub = new UportSubprovider({network})

  	uSub.provider.sendAsync = sinon.stub()
  	uSub.sendAsync({method: 'NOT_REAL'})
  	expect(uSub.provider.sendAsync).to.be.calledOnce
  })

  it('Passes error in callback if sendTransaction fails', (done) => {
  	const sendTransaction = sinon.stub().rejects('ERROR')
  	const uSub = new UportSubprovider({sendTransaction, network})

  	uSub.sendTransaction({}, (err, data) => {
  		expect(err).to.be.defined
   		expect(data).to.be.undefined
  		done()
  	})
  })

  it('Passes error in callback if requestAddress fails', (done) => {
  	const requestAddress = sinon.stub().rejects('ERROR')
  	const uSub = new UportSubprovider({requestAddress, network})

  	uSub.getAddress((err, data) => {
  		expect(err).to.be.defined
  		expect(data).to.be.undefined
  		done()
  	})
  })
	
  it('Detects injected providers and sets the appropriate flag [desktop]', async () => {
    const requestAddress = sinon.stub().resolves(mnid)
    const UportSubprovider = SubproviderLoader({
      'uport-transports/lib/transport/ui': ui,
      './util': { isMobile: () => false, hasWeb3: () => true }
    }).default

    const sendAsync = sinon.stub()
    window.web3 = { provider: { sendAsync }}

    const uSub = new UportSubprovider({network, requestAddress})
    expect(uSub.hasInjectedProvider).to.be.true
    expect(uSub.useInjectedProvider).to.be.undefined

    await uSub.sendAsync({method: 'eth_coinbase'}, console.log)
    
    expect(uSub.useInjectedProvider).to.be.true
    expect(sendAsync).to.be.calledOnce
  })

  it('Detects injected providers and sets the appropriate flag [mobile]', () => {
    const UportSubprovider = SubproviderLoader({
      'uport-transports/lib/transport/ui': ui,
      './util': { isMobile: () => true, hasWeb3: () => true }
    }).default

    const sendAsync = sinon.stub()
    window.web3 = { provider: { sendAsync }}

    const uSub = new UportSubprovider({network})
    expect(uSub.hasInjectedProvider).to.be.undefined
    expect(uSub.useInjectedProvider).to.be.true

    uSub.sendAsync()
    expect(sendAsync).to.be.calledOnce
  })

  it('Calls the passed signTypedData function for `eth_signTypedData` request, and encodes the signature', (done) => {
    const response = {r: '1234', s: '1234', v: 0}
    const signTypedData = sinon.stub().resolves({signature: response})
    const uSub = new UportSubprovider({signTypedData, network})
    uSub.hasInjectedProvider = false
    uSub.sendAsync({method: 'eth_signTypedData', params: [{data: 'fake'}]}, (err, {result}) => {
      expect(err).to.be.null
      expect(result).to.equal(encodeSignature(response))
      done()
    })
  })

  it('calls the passed personalSign function for `personal_sign` request, and encodes the signature', (done) => {
    const response = {r: '1234', s: '1234', v: 0}
    const personalSign = sinon.stub().resolves({signature: response})
    const uSub = new UportSubprovider({personalSign, network})
    uSub.hasInjectedProvider = false
    uSub.sendAsync({method: 'personal_sign', params: [{data: 'fake'}]}, (err, {result}) => {
      expect(err).to.be.null
      expect(result).to.equal(encodeSignature(response))
      done()
    })
  })
})

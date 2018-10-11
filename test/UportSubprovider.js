import { UportSubprovider } from '../src'
import HttpProvider from 'ethjs-provider-http'

import chai, { expect, assert } from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'

chai.use(sinonChai)

const network = {id: '0x4', rpcUrl: 'http://rinkeby.infura.io'}
const address = '0x122bd1a75ae8c741f7e2ab0a28bd30b8dbb1a67e'
const mnid = '2oeXufHGDpU51bfKBsZDdu7Je9weJ3r7sVG'
const badMnid = '2nSX6hxNMgvgP9MtvoJDgSjVHGRsTuxpyPi'

describe('UportSubprovider', () => {
  it('Accepts and wraps a custom provider', () => {
  	let rpcUrl = 'http://localhost:1234'
    let uSub = new UportSubprovider({provider: new HttpProvider('http://localhost:1234'), network})

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
	
  it('Calls the passed signTypedData function for `eth_signTypedData` request', (done) => {
	const response = 'res'
	const signTypedData = sinon.stub().resolves(response)
	const uSub = new UportSubprovider({signTypedData, network})
	uSub.sendAsync({method: 'eth_signTypedData', params: [{data: 'fake'}]}, (err, {result}) => {
		expect(err).to.be.null
		expect(result).to.equal(response)
		done()
  	})
  })
})

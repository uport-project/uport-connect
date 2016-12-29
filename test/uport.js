import { assert } from 'chai'
import Web3 from 'web3'
import { Uport } from '../lib/index'
import Autosigner from '../utils/autosigner'
import ProviderEngine from 'web3-provider-engine'
import Web3Subprovider from 'web3-provider-engine/subproviders/web3'

import testData from './testData.json'

// create random address
const chars = '0123456789abcdef'
let addr1 = '0x'

for (let i = 40; i > 0; --i) addr1 += chars[Math.floor(Math.random() * chars.length)]

describe('uport-lib integration tests', function () {
  this.timeout(30000)

  let autosigner, status, web3Provider, web3

  before((done) => {
    global.navigator = {}

    let testrpcProv = new Web3.providers.HttpProvider('http://localhost:8545')
    web3 = new Web3(testrpcProv)
    // Create Autosigner
    Autosigner.load(testrpcProv, (err, as) => {
      if (err) { throw err }
      autosigner = as
      console.log(autosigner.address)
      web3.eth.getAccounts((err, accounts) => {
        if (err) { throw err }

        // Create status contract
        let statusContractABI = web3.eth.contract(testData.statusContractAbiData)
        status = statusContractABI.new({
          data: testData.statusContractBin,
          from: accounts[0],
          gas: 3000000
        })
        // Send ether to Autosigner
        web3.eth.sendTransaction({from: accounts[0], to: autosigner.address, value: web3.toWei(90)}, (e, r) => {
          // Change provider
          // Autosigner is a qrDisplay
          // that automatically signs transactions
          let uport = new Uport('Integration Tests', {
            rpcUrl: 'http://localhost:8545',
            qrDisplay: autosigner 
          })
          // Using the uportSubprovider be able to use testrpc programmatically.
          // However TestRPC.provider() is causing problems with istanbul so it
          // isn't used currently, but we still want to keep this strucure for later.
          let uportSubprovider = uport.getUportSubprovider()
          web3Provider = new ProviderEngine()
          web3Provider.addProvider(uportSubprovider)
          web3Provider.addProvider(new Web3Subprovider(testrpcProv))
          web3Provider.start()
          done()
        })
      })
    })
  })

  it('getCoinbase', (done) => {
    web3.eth.getCoinbase((err, address) => {
      if (err) { throw err }
      assert.equal(address, autosigner.address)
      web3.eth.defaultAccount = address
      done()
    })
  })

  it('getAccounts', (done) => {
    web3.eth.getAccounts((err, addressList) => {
      if (err) { throw err }
      assert.equal(addressList.length, 1, 'there should be just one address')
      assert.equal(addressList[0], autosigner.address)
      done()
    })
  })

  it('sendTransaction', (done) => {
    web3.eth.sendTransaction({value: web3.toWei(2), to: addr1}, (err, txHash) => {
      if (err) { throw err }
      web3.eth.getBalance(addr1, (err, balance) => {
        if (err) { throw err }
        assert.equal(balance.toNumber(), web3.toWei(2))
        done()
      })
    })
  })

  it('use contract', (done) => {
    let coolStatus = 'Writing some tests!'
    status.updateStatus(coolStatus, (err, res) => {
      assert.isNull(err)
      status.getStatus.call(web3.eth.defaultAccount, (err, myStatus) => {
        assert.isNull(err)
        assert.equal(myStatus, coolStatus)
        done()
      })
    })
  })

  after((done) => {
    web3Provider.stop()
    done()
  })
})

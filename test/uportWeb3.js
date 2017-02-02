import { assert } from 'chai'
import Web3 from 'web3'
import { Uport } from '../src/uport'
import Autosigner from '../utils/autosigner'
import testData from './testData.json'

const addr1 = '0x9d00733ae37f34cdebe443e5cda8e9721fffa092'

describe('uportWeb3 integration tests', function () {
  this.timeout(30000)

  let autosigner, status, vanillaWeb3, web3

  before((done) => {
    global.navigator = {}

    const testrpcProv = new Web3.providers.HttpProvider('http://localhost:8545')
    vanillaWeb3 = new Web3(testrpcProv)
    // Create Autosigner
    Autosigner.load(testrpcProv, (err, as) => {
      if (err) { throw err }
      autosigner = as
      console.log(autosigner.address)
      vanillaWeb3.eth.getAccounts((err, accounts) => {
        if (err) { throw err }

        // Create status contract
        let statusContractABI = vanillaWeb3.eth.contract(testData.statusContractAbiData)
        status = statusContractABI.new({
          data: testData.statusContractBin,
          from: accounts[0],
          gas: 3000000
        })
        // Send ether to Autosigner
        vanillaWeb3.eth.sendTransaction({from: accounts[0], to: autosigner.address, value: vanillaWeb3.toWei(90)}, (e, r) => {
          // Change provider
          // Autosigner is a qrDisplay
          // that automatically signs transactions
          const uport = new Uport('Integration Tests', {
            // ipfsProvider: {host: '127.0.0.1', port: 5001, protocol: 'http'},
            rpcUrl: 'http://localhost:8545',
            showHandler: autosigner.openQr.bind(autosigner)
          })
          web3 = uport.getWeb3()
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

  // it('use contract', (done) => {
  //   let coolStatus = 'Writing some tests!'
  //   status.updateStatus(coolStatus, (err, res) => {
  //     assert.isNull(err)
  //     status.getStatus.call(web3.eth.defaultAccount, (err, myStatus) => {
  //       assert.isNull(err)
  //       assert.equal(myStatus, coolStatus)
  //       done()
  //     })
  //   })
  // })
})

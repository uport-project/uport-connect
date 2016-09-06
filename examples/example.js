// TODO: This example needs updating

// Modules && Setup
let Web3 = require('web3')
let web3 = new Web3()
web3.setProvider(uportProvider)

let Uport = require('../lib/index.js')
let uport = new Uport('Simple example')
let uportProvider = uport.getUportProvider()

let statusContract = web3.eth.contract([{
  'constant': false,
  'inputs': [{
    'name': 'status',
    'type': 'string'
  }],
  'name': 'updateStatus',
  'outputs': [],
  'type': 'function'
}, {
  'constant': false,
  'inputs': [{
    'name': 'addr',
    'type': 'address'
  }],
  'name': 'getStatus',
  'outputs': [{
    'name': '',
    'type': 'string'
  }],
  'type': 'function'
}])

let status = statusContract.at('0x60dd15dec1732d6c8a6125b21f77d039821e5b93')

// Mined confimation callback
const waitForMined = (txHash, response) => {
  console.log(response)
  if (response.blockNumber) {
    status.getStatus.call(web3.eth.defaultAccount, (error, response) => {
      if (error) { throw error }
      console.log('My status is: ' + response)
    })
  } else {
    web3.eth.getTransaction(txHash, (error, response) => {
      if (error) { throw error }
      waitForMined(txHash, response)
    })
  }
}

// Action call
web3.eth.getCoinbase(function (err, address) {
  if (err) { throw err }
  console.log('address: ' + address)

  web3.eth.defaultAccount = address

  // web3.eth.sendTransaction({
  //   value: 10,
  //   to: '0xd611e4d19949ceb79ee04c88aff5fc6c879e0e1e'
  // }, function(err, txHash) {
  //  console.log("txHash: " + txHash) }
  // });

  status.updateStatus('lalalalla', (error, response) => {
    if (error) { throw error }
    console.log('Waiting for tx to be mined.')

    waitForMined(response, { blockNumber: null })
  })
})

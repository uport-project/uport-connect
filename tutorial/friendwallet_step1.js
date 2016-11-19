/* global Web3 globalState render */

// Setup

let rpcUrl = 'https://consensysnet.infura.io:8545'
let Uport = window.uportlib.Uport
let web3 = new Web3()
let appName = 'FriendWallet'
let options = {}
let uport = new Uport(appName, options)
let uportProvider = uport.getUportProvider(rpcUrl)
web3.setProvider(uportProvider)

// uPort connect

const uportConnect = function () {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.uportId = address
    render()
  })
}

// Send ether
const sendEther = () => {
  let value = parseFloat(globalState.sendToVal) * 1.0e18
  let gasPrice = 100000000000
  let gas = 500000

  web3.eth.sendTransaction(
    {
      from: globalState.uportId,
      to: globalState.sendToAddr,
      value: value,
      gasPrice: gasPrice,
      gas: gas
    },
    (error, txHash) => {
      if (error) { throw error }
      globalState.txHash = txHash
      render()
    }
  )
}

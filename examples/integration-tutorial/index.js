/* global Web3 globalState render */

// Setup
var web3;
const Connect = window.uportconnect
const yourAppName = 'UportTutorial'
const connect = new Connect(yourAppName, {network: 'rinkeby'})
const provider = connect.getProvider()
web3 = new Web3(provider)
// Work around to issue with web3 requiring a from parameter. This isn't actually used.
web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'

const abi = [{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]
const StatusContract = web3.eth.contract(abi).at('0x70A804cCE17149deB6030039798701a38667ca3B')

const getAndRenderBlockchainState = (address) => {
  StatusContract.getStatus.call(address, (err, status) => {
    globalState.currentStatus = status
    web3.eth.getBalance(address, (err, bal) => {
      globalState.ethBalance = web3.fromWei(bal)
      render()
    })
  })
}

// If state already availabe in connect onload, render it
if (connect.did) {
  globalState.ethAddress = connect.address
  globalState.uportId = connect.did
  render()
  getAndRenderBlockchainState(globalState.ethAddress)
}


// uPort connect
const uportConnect = function () {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.ethAddress = address
    globalState.uportId = connect.did
    render()
    getAndRenderBlockchainState(globalState.ethAddress)
  })
}

// Send ether
const sendEther = () => {
  const value = parseFloat(globalState.sendToVal) * 1.0e18
  const txObj = { to: globalState.sendToAddr, value: value }
  web3.eth.sendTransaction(txObj, (error, txHash) => {
    if (error) { throw error }
    globalState.txHashSentEth = txHash
    render()
  })
}

// Set Status
const setStatus = () => {
  const newStatusMessage = globalState.statusInput
  StatusContract.updateStatus(newStatusMessage, (error, txHash) => {
    if (error) { throw error }
    globalState.txHashSetStatus = txHash
    render()
  })
}

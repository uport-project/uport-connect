/* global Web3 globalState render */

// Setup

const Connect = window.uportconnect.Connect
const appName = 'UportTutorial'
const connect = new Connect(appName, {network: 'rinkeby'})
const web3 = connect.getWeb3()

const abi = [{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]

const StatusContract = web3.eth.contract(abi);
const statusInstance = StatusContract.at('0x70A804cCE17149deB6030039798701a38667ca3B')

// uPort connect
const uportConnect = function () {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.uportId = address
    globalState.ethAddress = window.uportconnect.MNID.decode(globalState.uportId).address
    statusInstance.getStatus.call(globalState.ethAddress, (err, st) => {
      globalState.currentStatus = st
      web3.eth.getBalance(globalState.ethAddress, (err, bal) => {
        globalState.ethBalance = web3.fromWei(bal)
        render()
      })
    })
  })
}

// Send ether
const sendEther = () => {
  const value = parseFloat(globalState.sendToVal) * 1.0e18
  const gasPrice = 100000000000
  const gas = 500000

  web3.eth.sendTransaction(
    {
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

// Set Status

const setStatus = () => {

  const newStatusMessage = globalState.statusInput
  
  statusInstance.updateStatus(newStatusMessage,
                           (error, txHash) => {
                             if (error) { throw error }
                             globalState.txHashSetStatus = txHash
                             render()
                           })

}

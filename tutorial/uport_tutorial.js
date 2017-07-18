/* global Web3 globalState render */

// Setup

const Connect = window.uportconnect.Connect
const appName = 'UportTutorial'
const connect = new Connect(appName, {network: 'rinkeby'})
const web3 = connect.getWeb3()


// Setup the simple Status contract - allows you to set and read a status string

const abi = [{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]

const StatusContract = web3.eth.contract(abi);
const statusInstance = StatusContract.at('0x70A804cCE17149deB6030039798701a38667ca3B')

// uPort connect
const uportConnect = function () {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.ethAddress = address

    // This one is for display purposes - MNID encoding includes network 
    globalState.uportId = window.uportconnect.MNID.encode({network: '0x4', address: address})

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

  web3.eth.sendTransaction(
    {
      to: globalState.sendToAddr,
      value: value
    },
    (error, txHash) => {
      if (error) { throw error }
      globalState.txHashSentEth = txHash
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

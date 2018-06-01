/* global Web3 globalState render */

// Setup

const Connect = window.uportconnect
const yourAppName = 'UportTutorial'
const connect = new Connect(yourAppName, {network: 'rinkeby'})
const provider = connect.getProvider()
// provider.getAddress((err, res) => {console.log(err);console.log(res)})
    const web3 = new Web3()
    web3.setProvider(provider)
    // // Work around to issue with web3 requiring a from parameter. This isn't actually used.
    // web3.eth.defaultAccount = '0xB42E70a3c6dd57003f4bFe7B06E370d21CDA8087'

// console.log(provider)
// const web3 = new Web3()
// web3.setProvider(provider)
// console.log(web3)
// web3.eth.defaultaccount = '0x71845bbfe5ddfdb919e780febfff5eda62a30fdc'

// Setup the simple Status contract - allows you to set and read a status string

const abi = [{"constant":false,"inputs":[{"name":"status","type":"string"}],"name":"updateStatus","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"getStatus","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}]
//
const StatusContract = connect.contract(abi);
const statusInstance = StatusContract.at('0x71845bbfe5ddfdb919e780febfff5eda62a30fdc')
// console.log(statusInstance)

// uPort connect
const uportConnect = function () {
  // connect.requestAddress()
  web3.eth.getCoinbase((error, address) => {
    console.log(error)
    console.log(address)
    // if (error) { throw error }
    globalState.ethAddress = address

    // This one is for display purposes - MNID encoding includes network
    globalState.uportId = window.uportconnect.MNID.encode({network: '0x4', address: address})

    // statusInstance.getStatus.call(globalState.ethAddress, (err, st) => {
    //   globalState.currentStatus = st
    //   web3.eth.getBalance(globalState.ethAddress, (err, bal) => {
    //     globalState.ethBalance = web3.fromWei(bal)
    //     render()
    //   })
    // })
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
  statusInstance.updateStatus(newStatusMessage, 'updateStatus')
  connect.onResponse('updateStatus').then(payload => {
    globalState.txHashSetStatus = payload.res
    render()
  })
  // statusInstance.updateStatus(newStatusMessage,
  //                          (error, txHash) => {
  //                            if (error) { throw error }
  //                            globalState.txHashSetStatus = txHash
  //                            render()
  //                          })

}

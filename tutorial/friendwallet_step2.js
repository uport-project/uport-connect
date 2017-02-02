/* global Web3 globalState render */

// Setup

const Connect = window.uportconnect.Connect
const appName = 'FriendWallet'
const uport = new Connect(appName)
const web3 = uport.getWeb3()

// uPort connect

const uportConnect = () => {
  web3.eth.getCoinbase((error, address) => {
    console.log(error)
    if (error) { throw error }
    globalState.uportId = address
    uport.getUserPersona(address).then((persona)=> {
      console.log('Test')
      console.log(persona)
      const profile = persona.profile
      console.log(profile)
      globalState.name = profile.name
      render()
    }).catch((e) => {console.log(e)})
  })
}


// Send ether
const sendEther = () => {
  const value = parseFloat(globalState.sendToVal) * 1.0e18
  const gasPrice = 100000000000
  const gas = 500000

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

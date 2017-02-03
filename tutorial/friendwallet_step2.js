/* global Web3 globalState render */

// Setup

const Connect = window.uportconnect.Connect
const appName = 'FriendWallet'
const connect = new Connect(appName)
const web3 = connect.getWeb3()

// uPort connect

const uportConnect = () => {
  connect.requestCredentials().then((credentials) => {
    console.log(credentials)
    globalState.uportId = credentials.address
    globalState.name = credentials.name
    render()
  }, console.err)
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

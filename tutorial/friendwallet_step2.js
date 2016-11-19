/* global Web3 globalState render */

// Setup

let rpcUrl = 'https://consensysnet.infura.io:8545'
let Uport = window.uportlib.Uport
let web3 = new Web3()
let appName = 'FriendWallet'

let ipfs = {
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
  root: ''
}

// App options
let options = {
  ipfsProvider: ipfs
}

let uport = new Uport(appName, options)
let uportProvider = uport.getUportProvider(rpcUrl)
web3.setProvider(uportProvider)

// uPort connect

const uportConnect = () => {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.uportId = address

    let Persona = window.uportlib.Persona
    let persona = new Persona(address, ipfs, web3.currentProvider)
    persona.load().then(() => {
      let profile = persona.getProfile()
      globalState.name = profile.name

      // Set up the list of contacts
      let contactAddresses = profile.knows
      let contactPersonas = contactAddresses.map((addr) => {
        return new Persona(addr, ipfs, web3.currentProvider)
      })
      let contactPromises = contactPersonas.map((p) => {
        return p.load()
      })
      Promise.all(contactPromises).then(() => {
        for (let i = 0; i < contactAddresses.length; i++) {
          let persona = contactPersonas[i]
          let profile = persona.getProfile()

          globalState.nameAddrMap[profile.name] = contactAddresses[i]
        }
        console.log(globalState.nameAddrMap)
        render()
      })
    })
  })
}

// Send ether
const sendEther = () => {
  let value = parseFloat(globalState.sendToVal) * 1.0e18
  let gasPrice = 100000000000
  let gas = 500000
  let sendToAddr = globalState.nameAddrMap[globalState.selectedSendToName]

  web3.eth.sendTransaction(
    {
      from: globalState.uportId,
      to: sendToAddr,
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

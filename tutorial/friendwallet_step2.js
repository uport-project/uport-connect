/* global Web3 globalState render */

// Setup

const rpcUrl = 'https://ropsten.infura.io'
const Uport = window.uportlib.Uport
const web3 = new Web3()
const appName = 'FriendWallet'

const ipfs = {
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
  root: ''
}

// App options
const options = {
  ipfsProvider: ipfs
}

const uport = new Uport(appName, options)
const uportProvider = uport.getUportProvider(rpcUrl)
web3.setProvider(uportProvider)

// uPort connect

const uportConnect = () => {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.uportId = address

    const Persona = window.uportlib.Persona
    const persona = new Persona(address, ipfs, web3.currentProvider)
    persona.load().then(() => {
      const profile = persona.getProfile()
      globalState.name = profile.name

      // Set up the list of contacts
      const contactAddresses = profile.knows
      const contactPersonas = contactAddresses.map((addr) => {
        return new Persona(addr, ipfs, web3.currentProvider)
      })
      const contactPromises = contactPersonas.map((p) => {
        return p.load()
      })
      Promise.all(contactPromises).then(() => {
        for (let i = 0; i < contactAddresses.length; i++) {
          const contactPersona = contactPersonas[i]
          const contactProfile = contactPersona.getProfile()

          globalState.nameAddrMap[contactProfile.name] = contactAddresses[i]
        }
        console.log(globalState.nameAddrMap)
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
  const sendToAddr = globalState.nameAddrMap[globalState.selectedSendToName]

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

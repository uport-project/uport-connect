/* global Web3 globalState render */

// Setup

const Uport = window.uportlib.Uport
const appName = 'FriendWallet'
const uport = new Uport(appName)
const web3 = uport.getWeb3()

// uPort connect

const uportConnect = () => {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.uportId = address    
    uport.getUserPersona(address).then((persona)=> {
      console.log(persona)
      const profile = persona.profile
      console.log(profile)
      globalState.name = profile.name

      // // Set up the list of contacts
      // const contactAddresses = profile.knows

      // // TODO update this. Registry has code to pull down multiple personas
      // const contactPersonas = contactAddresses.map((addr) => {
      //   return new Persona(addr, ipfs, web3.currentProvider)
      // })
      // const contactPromises = contactPersonas.map((p) => {
      //   return p.load()
      // })
      // Promise.all(contactPromises).then(() => {
      //   for (let i = 0; i < contactAddresses.length; i++) {
      //     const contactPersona = contactPersonas[i]
      //     const contactProfile = contactPersona.getProfile()

      //     globalState.nameAddrMap[contactProfile.name] = contactAddresses[i]
      //   }
      //   console.log(globalState.nameAddrMap)
      //   render()
      // })
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

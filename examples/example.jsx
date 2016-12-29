import React, { Component } from 'react'
import { Uport } from 'uport-lib'
import Web3 from 'web3'
import logo from './logo.svg'
import './App.css'

class App extends Component {

  componentWillMount () {
    let uport = new Uport('TEST92184091284091284')
    let web3 = uport.getWeb3()

    this.getCoinbase = function () {
      web3.eth.getCoinbase(function (err, address) {
        if (err) { throw err }
        console.log('address: ' + address)
        web3.eth.defaultAccount = address

        uport.getUserPersona().then((userPersona) => {
          let profile = userPersona.profile
          console.log(profile)
        })
      })
    }
  }

  componentDidMount () {
    this.getCoinbase()
  }

  render () {
    return (
      <div className='App'>
        <div className='App-header'>
          <img src={logo} className='App-logo' alt='logo' />
          <h2>Welcome to uPort</h2>
        </div>
        <p className='App-intro'>To get started, edit <code>src/App.js</code> and save to reload.</p>
      </div>
    )
  }
}

export default App

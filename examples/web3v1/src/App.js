import React, { Component } from 'react'
import { Connect } from 'uport-connect'
import Web3 from 'web3'

import abi from './abi.json'

import 'bootstrap/dist/css/bootstrap.css'
import './App.css'

// Setup Connect and web3
const connect = new Connect('Test Web3', {network: 'rinkeby'})
const provider = connect.getProvider()
const web3 = new Web3(provider)

const StatusContract = new web3.eth.Contract(abi, '0x70A804cCE17149deB6030039798701a38667ca3B')

class App extends Component {
  constructor(props) {
    super(props)

    const {did, address, keypair} = connect

    this.state = {
      ethAddress: address,
      uportId: did,
      appId: keypair.did
    }

    this.logout = this.logout.bind(this)
    this.sendEther = this.sendEther.bind(this)
    this.setStatus = this.setStatus.bind(this)
    this.updateField = this.updateField.bind(this)
    this.connectUport = this.connectUport.bind(this)
    this.getBlockchainState = this.getBlockchainState.bind(this)
  }

  updateField(event) {
    let {name, value} = event.target
    this.setState({[name]: value})
  }

  connectUport() {
    web3.eth.getCoinbase((err, address) => {
      if (err) { throw err }
      this.setState({ethAddress: address, uportId: connect.did, appId: connect.keypair.did})
      this.getBlockchainState()
    })
  }

  getBlockchainState() {
    const { ethAddress } = this.state

    // Get balance
    web3.eth.getBalance(ethAddress, (err, balance) => {
      this.setState({ethBalance: web3.utils.fromWei(balance)})
    })

    // Get status
    StatusContract.methods.getStatus(ethAddress).call({from: ethAddress}, (err, status) => {
      this.setState({currentStatus: status})
    })
  }

  sendEther() {
    const { amount, sendTo, ethAddress } = this.state
    web3.eth.sendTransaction({to: sendTo, value: amount, from: ethAddress}, (err, ethTxHash) => {
      if (err) { throw err }
      this.setState({ethTxHash})
    })
  }

  setStatus() {
    const { status, ethAddress } = this.state
    StatusContract.methods.updateStatus(status).send({from: ethAddress}, (err, statusTxHash) => {
      if (err) { throw err }
      this.setState({statusTxHash})
    })
  }

  logout() {
    connect.logout()
    provider.address = null
    this.setState({ethAddress: null, uportId: null})
  }

  render() {
    const { uportId, ethAddress, appId, ethBalance, currentStatus, sendTo, amount, status, ethTxHash, statusTxHash } = this.state

    return (
      <main>
        <header>
          <h1 id="appName">Uport Dapp Tutorial</h1>
          <p>Please make sure to run <code>npm i</code> from the examples/web3v1 directory in your command terminal before trying this locally.</p>
        </header>
        <hr/>
        <section>
          <h2>Connect uPort</h2>
          <div>
            <div>App Id: <code>{appId}</code></div>
            <div>uPort Id: <code>{uportId}</code></div>
            <div>ETH Address: <code>{ethAddress}</code></div>
          </div>
          <button className="btn btn-primary"
            onClick={this.connectUport}>Connect uPort</button>
          <button className="btn btn-warning" disabled={!uportId}
            onClick={this.logout}>Logout</button>
        </section>
        <section>
          <h2>Send Ether</h2>
          <label>Send To: 
            <input name="sendTo" value={sendTo} onChange={this.updateField} />
          </label>
          <label>Amount (in wei): 
            <input name="amount" value={amount} onChange={this.updateField} />
          </label>
          <button  className="btn btn-primary" onClick={this.sendEther}>Send Ether!</button>
          <div>ETH Balance: {ethBalance}</div>
          <div>Transaction Hash(ID): {ethTxHash}</div>
        </section>
        <section>
          <h2>Set Status</h2>
          <label>Enter current status: 
            <input name="status" value={status} placeholder="Feeling good..." onChange={this.updateField} />
          </label>
          <button className="btn btn-success" onClick={this.setStatus}>Set Status</button>
          <div>Current Status: {currentStatus}</div>
          <div>Transaction Hash(ID): {statusTxHash}</div>
        </section>
      </main>
    );
  }
}

export default App;

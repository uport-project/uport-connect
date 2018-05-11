
# How to integrate uPort into your dapp

## Introduction

This tutorial will show you how to add support for uPort in your decentralized Ethereum application. Using the `uport-connect` library, we will create a simple application. This application will let you connect your uPort, send simple Ether transactions and set a simple status message in a smart contract.

We will assume some familiarity with creating Ethereum applications using the `web3` library.

*Note: The examples provided inline here and in the example files use ES6. Although our library is also written in ES6, it is transpiled to ES5, thus is perfectly compatible if you choose to use ES5 instead. These examples are simple to change to ES5 if your needs require.*

## Getting started

Clone the `uport-connect` repository locally, and build it:

```
git clone https://github.com/uport-project/uport-connect
cd uport-connect
npm install
npm run build-dist
```

We will be working in the directory `uport-connect/tutorial`.

Make sure you have the uPort application installed on your mobile device. An iOS beta developer version of the app is currently available through TestFlight. To receive instructions on how to acquire the app please enter your details at the following url <https://uport.me/signup>.

We've created a simple HTML file `uport_tutorial.html` that you can find [here](https://github.com/uport-project/uport-connect/blob/develop/tutorial/uport_tutorial.html). It contains a section for connecting your uPort, one section for a transfer of Ether from your uPort address to another address and a section that sets a simple status message in a smart contract.

In order to test the dapp, all you need to do is open the file `uport_tutorial.html` in a browser. There is a file `uport_tutorial.js` that will contain the JavaScript integration code.

Consider the necessary code to set up the `web3` object with the uPort provider:

```
const Connect = window.uportconnect.Connect
const appName = 'UportTutorial'
const connect = new Connect(appName, {network: 'rinkeby'})
const web3 = connect.getWeb3()
```

The uPort library sets up the web3 object using a web3 provider. This is the mechanism that interprets calls to web3 functions and this is what will trigger the QR codes for connecting your uPort and signing transactions.

The `uportConnect()` function will trigger the "login" and populate the user's uPort address in the UI.

Load the HTML file in your browser and hit "Connect uPort". You should see a QR code come up. When you scan it with the uPort app you should see your uPort address being populated in the UI.

The functions that trigger QR codes are

```
web3.eth.getCoinbase() //returns your uport address
web3.eth.getAccounts() //returns your uport address in a list
web3.eth.sendTransaction(txObj) //returns a transaction hash
myContract.myMethod() //returns a transaction hash
```

The functions `getAccounts()` and `getCoinbase()` trigger the QR code that brings up the "connect" QR code, or if you have already connected, the address is stored in the uport provider object and will be returned without showing the QR code. Due to this behaviour it is recommended to have a place in your dapp where the user can "log in" or "connect". If you call `getCoinbase()` right before it's needed (like right before sending a transaction) the user experience is not as good since the user needs to scan two QR codes in rapid succession.

The functions for sending ETH and setting the status are exactly how you would write them in vanilla `web3.js`. In order to send ETH you need to first fetch some Rinkeby Ether at the Rinkeby Faucet available here: <https://rinkeby.io>.

Try sending some Rinkeby ETH and setting the status! You should see QR codes appear when it's time to sign transactions, and you use your uPort app to scan them. After sending and setting the status you can reload the page and connect again to make sure the balance and status was updated.

You should now have a basic grasp of implementing uPort in your Dapp!

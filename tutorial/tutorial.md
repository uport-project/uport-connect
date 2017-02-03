
# How to integrate uPort into your dapp

## Introduction

This tutorial will show you how to add support for uPort in your application. Using the `uport-connect` library, we will create a simple application, FriendWallet, where you can connect your uPort and send Ether transactions. Later on you will be able to send Ether to the contacts in your uPort contact list.

We will create this app in two steps:

1. Using `uport-connect` we will enable you to connect your uPort and sign transactions using the built-in QR code system.
2. Using the "Persona" tools we will show you how to fetch profile data like your name and populate this in the UI.

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

Make sure you have the uPort application installed on your mobile device. An iOS beta developer version of the app is currently available through TestFlight. To receive instructions on how to acquire the app please enter your details at the following url <https://uport.me/signup> with the access code "devcon2".

## Step 1 - Connect and sign transactions

We've created a simple HTML file `friendwallet_step1.html` that you can find [here](https://github.com/uport-project/uport-connect/blob/develop/tutorial/friendwallet_step1.html). It contains a section for connecting your uPort, and another section for a transfer of Ether from your uPort address to another address.

We will create a file `friendwallet_step1.js` that will contain the JavaScript integration code.

To begin with we add the necessary code to set up the `web3` object with the uPort provider:

```
const Connect = window.uportconnect.Connect
const appName = 'FriendWallet'
const connect = new Connect(appName)
const web3 = connect.getWeb3()
```

The uPort library sets up the web3 object using a web3 provider. This is the mechanism that interprets calls to web3 functions and this is what will trigger the QR codes for connecting your uPort and signing transactions.

Now add the `uportConnect()` function that will populate the user's uPort address in the UI:

```
const uportConnect = function () {
  web3.eth.getCoinbase((error, address) => {
    if (error) { throw error }
    globalState.uportId = address
    render()
  })
}
```

Load the HTML file in your browser and hit "Connect uPort". You should see a QR code come up. When you scan it with the uPort app you should see your uPort address being populated in the UI.

The functions that trigger QR codes are

```
web3.eth.getCoinbase() //returns your uport address
web3.eth.getAccounts() //returns your uport address in a list
web3.eth.sendTransaction(txObj) //returns a transaction hash
myContract.myMethod() //returns a transaction hash
```

The functions `getAccounts()` and `getCoinbase()` trigger the QR code that brings up the "connect" QR code, or if you have already connected, the address is stored in the uport provider object and will be returned without showing the QR code. Due to this behaviour it is recommended to have a place in your dapp where the user can "log in" or "connect". If you call `getCoinbase()` right before it's needed (like right before sending a transaction) the user experience is not as good since the user needs to scan two QR codes in rapid succession.


Next we add a function for sending Ether:


```
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
```

This code will also trigger a QR code, prompting you to sign the transaction on the mobile app. This is a good time to go to the [Ropsten Faucet](http://faucet.ropsten.be:3001) and get some Ropsten Ether for your uPort before testing that sending works.

Feel free to verify in the HTML file that you can send some test Ether to the following address:

```
0xb65e3a3027fa941eec63411471d90e6c24b11ed1
```

You can check [here](https://test.ether.camp/account/b65e3a3027fa941eec63411471d90e6c24b11ed1) to make sure the transaction completes.

Congratulations! You have successfully been able to connect your uPort and to sign a transaction!

## Step 2 - Getting profile data with `requestCredentials`

In this section we'll demonstrate how to fetch public profile data from your uPort, and the uPort of others. The profile data is stored in IPFS and cryptographically linked to your uPort via a registry on Ethereum.

For this section we will use the HTML file `friendwallet_step2.html`, and the javascript file `friendwallet_step2.js`.

We will enhance the `uportConnect()` function by fetching your name and profile picture to display it in the UI:

```
const uportConnect = () => {
  connect.requestCredentials().then((credentials) => {
    console.log(credentials)
    globalState.uportId = credentials.address
    globalState.name = credentials.name
    render()
  }, console.err)
}
```

In order to test it out, open the HTML file and click "Connect uPort". After scanning the QR code you should see your uPort identifier as well as your name populated in the UI.

If you look at the Javascript console you will also see the whole public profile JSON object.

You should now have a basic grasp of implementing uPort in your Dapp!

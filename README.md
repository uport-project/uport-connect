# uport-lib
Main uPort library

## Cli proof of concept
You can try out the web3 provider in your terminal. Start by running the testrpc. Run the example:
```
$ node example.js
```
You can now use curl to act as uport-mobile.
```
curl -d address=<address> http://chasqui.uport.me/addr/<random number>
```
```
curl -d tx=<txHash> http://chasqui.uport.me/tx/<random number>
```

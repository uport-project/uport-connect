const abi = require('ethjs-abi');
const arrayContainsArray = require('ethjs-util').arrayContainsArray;
import MsgServer from './msgServer'
import MobileDetect from 'mobile-detect'

//TODO Move message server back to uport.js

const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'

// A derivative work of Nick Dodson's eths-contract https://github.com/ethjs/ethjs-contract/blob/master/src/index.js

function hasTransactionObject(args) {
  const txObjectProperties = ['from', 'to', 'data', 'value', 'gasPrice', 'gas'];
  if (typeof args === 'object' && Array.isArray(args) === true && args.length > 0) {
    if (typeof args[args.length - 1] === 'object'
      && (Object.keys(args[args.length - 1]).length === 0
      || arrayContainsArray(Object.keys(args[args.length - 1]), txObjectProperties, true))) {
      return true;
    }
  }

  return false;
}

function getConstructorFromABI(contractABI) {
  return contractABI.filter((json) => (json.type === 'constructor'))[0];
}

function getCallableMethodsFromABI(contractABI) {
  return contractABI.filter((json) => ((json.type === 'function' || json.type === 'event') && json.name.length > 0));
}

function ContractFactory(contractABI, msgServer) {
    const output = {};
    output.at = function atContract(address) {

      function Contract() {
        const self = this;
        self.abi = contractABI || [];
        self.address = address || '0x';
        const md = new MobileDetect(navigator.userAgent)
        this.isOnMobile = (md.mobile() !== null)
        const chasquiUrl = CHASQUI_URL
        this.msgServer = new MsgServer(chasquiUrl, this.isOnMobile)

        getCallableMethodsFromABI(contractABI).forEach((methodObject) => {

          self[methodObject.name] = function contractMethod() {

            var providedTxObject = {};
            const methodArgs = [].slice.call(arguments);

            if (methodObject.type === 'function') {

                if (hasTransactionObject(methodArgs)) providedTxObject = methodArgs.pop();
                const methodTxObject = Object.assign({},
                  providedTxObject, {
                    to: self.address,
                  });

                methodTxObject.data = abi.encodeMethod(methodObject, methodArgs);

                if (methodObject.constant === false) {
                  // TODO if true throw error
                  // queryMethod = 'sendTransaction';
                }

                let ethUri = txParamsToUri(methodTxObject)


                //TODO Separate the messaging server more
                const topic = this.msgServer.newTopic('tx')

                ethUri += '&callback_url=' + topic.url

                const listener = new Promise((resolve, reject) => {
                  this.msgServer.waitForResult(topic, (err, txHash) => {
                    if (err) { reject(err) }
                    resolve(txHash)
                  })
                })

                return {"uri": ethUri, "listen": listener  }

            }
            // if filter throw error
          };
        });
      }

      return new Contract();
    };

    return output;
  };


const txParamsToUri = (txParams) => {
    let uri = 'me.uport:' + txParams.to
    let symbol
    if (!txParams.to) {
      return cb(new Error('Contract creation is not supported by uportProvider'))
    }
    if (txParams.value) {
      uri += '?value=' + parseInt(txParams.value, 16)
    }
    if (txParams.data) {
      symbol = txParams.value ? '&' : '?'
      uri += symbol + 'bytecode=' + txParams.data
    }
    if (txParams.gas) {
      symbol = txParams.value || txParams.data ? '&' : '?'
      uri += symbol + 'gas=' + parseInt(txParams.gas, 16)
    }
    return uri
  }


  export default ContractFactory

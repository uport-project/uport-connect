const arrayContainsArray = require('ethjs-util').arrayContainsArray;

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

function ContractFactory(contractABI, extend) {
    const output = {};
    output.at = function atContract(address) {

      function Contract() {
        const self = this;
        self.abi = contractABI || [];
        self.address = address || '0x';

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

                methodTxObject.data = encodeMethodReadable(methodObject, methodArgs)

                if (methodObject.constant === false) {
                  // TODO if true throw error
                  // queryMethod = 'sendTransaction';
                }

                if (!extend) return methodTxObject

                return extend(methodTxObject)
            }
            // if filter throw error
          };
        });
      }

      return new Contract();
    };

    return output;
  };


const encodeMethodReadable = (methodObject, methodArgs) => {
  let dataString = `${methodObject.name}(`
    for (let i = 0; i < methodObject.inputs.length; i++) {
      const input = methodObject.inputs[i]
      let argString = `${input.type} `

      if (input.type === 'string') {
        argString += `'${methodArgs[i]}'`
      } else if (input.type === ( 'bytes32' || 'bytes')) {
        // TODO don't assume hex input?
        // argString += `0x${new Buffer(methodArgs[i], 'hex')}`
        argString += `${methodArgs[i]}`
      } else {
        argString += `${methodArgs[i]}`
      }

      dataString += argString

      if ((methodObject.inputs.length - 1) !== i) {
        dataString += `, `
      }
    }
    return dataString += `)`
}

export default ContractFactory

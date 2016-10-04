import { Persona } from 'uport-persona'
import ipfsAPI from 'ipfs-api'

/**
 * Class representing a persona that can be modified.
 * @extends Persona
 * */
class RemoteMutablePersona extends Persona {

  /**
   *  Class constructor.
   *  Creates a new persona object. The registryAddress is an optional argument and if not specified will be set to the default consensys testnet uport-registry.
   *
   *  @memberof RemoteMutablePersona
   *  @method          constructor
   *  @param           {String}         address                                                             the address of the persona
   *  @param           {String}         ipfsProvider                                                        an ipfs provider
   *  @param           {String}         web3Provider                                                        web3 provider
   *  @param           {String}         [registryAddress='0xa9be82e93628abaac5ab557a9b3b02f711c0151c']      the uport-registry address to use.
   *  @return          {Object}         self
   */
  constructor (proxyAddress, ipfsProvider, web3Provider, handleURI, msgServer, registryAddress) {
    super(proxyAddress, ipfsProvider, web3Provider, registryAddress)
    this.handleURI = handleURI
    this.msgServer = msgServer
    this.attrToAdd = []
    this.attrToRemove = []
    this.claimsToAdd = []
    this.claimsToRemove = []
    this.ipfs = ipfsAPI(ipfsProvider)
  }

  /**
   *  This should be the only function ever used to write the persona onto the blockchain. It returns a promise that
   *  returns the transaction hash of the transaction updating the registry. Since this is a RemoteMutablePersona
   *  the promise will return after the transaction has been mined and the persona object has been updated with the
   *  new attributes/claims.
   *
   *  @memberof RemoteMutablePersona
   *  @method          writeToRegistry
   *  @return          {Promise<String, Error>}            A promise that returns the txHash of the transaction updating the registry, or an Error if rejected.
   */
  writeToRegistry () {
    const self = this
    const obj = self.createUpdateObject()
    return new Promise((resolve, reject) => {
      let transactionHash
      self.ipfs.object.put(obj)
      .then((res) => {
        console.log(res)
        console.log(res.multihash())
        let ipfsHash = res.multihash()
        return pushToMobile.call(self, ipfsHash)
      })
      .then((txHash) => {
        transactionHash = txHash
        return self.load()
      })
      .then(() => {
        Promise.resolve(transactionHash)
      })
    })
  }

  createUpdateObject () {
    return {
      add: {
        attributes: this.attrToAdd,
        claims: this.claimsToAdd
      },
      remove: {
        attributes: this.attrToRemove,
        claims: this.claimsToRemove
      }
    }
  }

  /**
   *  Add a signed claim to this persona. This should be used to add tokens signed by third parties.
   *
   *  @memberof RemoteMutablePersona
   *  @method          addClaim
   *  @param           {JSON}                     token          the claim to add
   */
  addClaim (token) {
    if (!Persona.isTokenValid(token)) {
      throw new Error('Token containing claim is invalid, and thus not added.')
    }
    this.claimsToAdd.push(token)
  }

  /**
   *  Add mulitple signed claims to this persona. This should be used to add tokens signed by third parties.
   *
   *  @memberof RemoteMutablePersona
   *  @method          addClaims
   *  @param           {JSON}                     tokensList          the claims to add
   */
  addClaims (tokensList) {
    for (let token of tokensList) {
      this.addClaim(token)
    }
  }

  /**
   *  Removes a signed claim from a persona.
   *
   *  @memberof RemoteMutablePersona
   *  @method          removeClaim
   *  @param           {JSON}                     tokens          the claims to add
   */
  removeClaim (token) {
    let idx1 = this.tokenRecords.indexOf(token)
    let idx2 = this.claimsToAdd.indexOf(token)
    if (idx1 === -1 && idx2 === -1) {
      throw new Error('No such token associated with this persona.')
    }
    if (idx1 !== -1) {
      this.claimsToRemove.push(token)
    }
    if (idx1 !== -1) {
      this.claimsToAdd.splice(idx2)
    }
  }

  /**
   *  Adds a self signed attribute to the persona. Only to be used if you can send transactions as persona.address.
   *
   *  @memberof RemoteMutablePersona
   *  @method          addAttribute
   *  @param           {Object}                     attribute          the attribute to add, in the format {attrName: attr}
   */
  addAttribute (attribute) {
    this.attrToAdd(attribute)
  }

  /**
   *  Removes all tokens having the same attribute name as the given attribute and adds the given attribute. Only to be used if you can send transactions as persona.address.
   *
   *  @memberof RemoteMutablePersona
   *  @method          replaceAttribute
   *  @param           {Object}                     attribute          the attribute to add, in the format {attrName: attr}
   */
  replaceAttribute (attribute) {
    const attributeName = Object.keys(attribute)[0]
    this.removeAttribute(attributeName)
    this.addAttribute(attribute)
  }

  /**
   *  Removes all attributes with the same attribute name as the given attribute. Only to be used if you can send transactions as persona.address.
   *
   *  @memberof RemoteMutablePersona
   *  @method          removeAttribute
   *  @param           {Object}                     attribute          the attribute to add, in the format {attrName: attr}
   */
  removeAttribute (attributeName) {
    this.tokenRecords = this.tokenRecords.filter(Persona.notMatchesAttributeName(attributeName))
  }

  /**
   *  Sets the public signing key of the persona.
   *
   *  @memberof RemoteMutablePersona
   *  @method       setPublicSigningKey
   *  @param        {String}                        privSignKey         the private signing key of the persona
   */
  setPublicSigningKey (privSignKey) {
    let pub = Persona.privateKeyToPublicKey(privSignKey)
    this.replaceAttribute({'pubSignKey': pub})
  }
  /**
   *  Sets the public encryption key of the persona.
   *
   *  @memberof RemoteMutablePersona
   *  @method       setPublicencryptionKey
   *  @param        {String}                        pubEncKey           the public encryption key of the persona
   */
  setPublicEncryptionKey (pubEncKey) {
    this.replaceAttribute({'pubEncKey': pubEncKey})
  }
}

const pushToMobile = (hash) => {
  const self = this
  return new Promise((resolve, reject) => {
    // we use the tx topic since the result from the phone will be a transaction
    let topic = self.msgServer.newTopic('tx')
    let uri = 'me.uport:claims?data=' + hash
    uri += '&callback_url=' + topic.url
    self.handleURI(uri)
    self.msgServer.waitForResult(topic, (err, tx) => {
      self.qrdisplay.closeQr()
      if (err) {
        reject(err)
      } else {
        resolve(tx)
      }
    })
  })
}

export default RemoteMutablePersona

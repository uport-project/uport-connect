import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import IPFS from 'ipfs-mini'

import { Connect } from '../../src'
import { decodeJWT } from 'did-jwt'

chai.use(sinonChai)

const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

describe('Connect', () => {

  beforeEach(() => {
    window.localStorage.clear()
  })

  /*********************************************************************/

  describe('signAndUploadProfile', () => {
    const vc = ['fake']

    it('skips upload if vc is preconfigured', async () => {
      const uport = new Connect('test app', { vc })
      await uport.signAndUploadProfile()

      expect(uport.vc).to.deep.equal(vc)
    })

    it('uploads a self-signed profile to ipfs if none is configured or provided', async function () {
      this.timeout(20000);
      console.log('RUN TEST')
      const uport = new Connect('test app', { description: 'It tests' })

      const jwt = {
        name: 'test app',
        description: 'It tests',
        url: 'http://localhost:9876'
      }

      await uport.signAndUploadProfile()
      expect(uport.vc[0]).to.match(/^\/ipfs\//)
      console.log('VC')
      console.log(uport.vc[0])
      return new Promise((resolve, reject) => {
        console.log(`ipfs.cat(${uport.vc[0].replace(/^\/ipfs\//, '')})`)
        ipfs.cat(uport.vc[0].replace(/^\/ipfs\//, ''), (err, res) => {
          if (err) reject(err)
          console.log('RES:')
          console.log(res)
          console.log('ENDRES')
          const { payload } = decodeJWT(res)
          expect(payload.sub).to.equal(uport.keypair.did)
          const profile = payload.claim
          expect(profile.name).to.equal(jwt.name)
          expect(profile.description).to.equal(jwt.description)
          expect(profile.url).to.equal(jwt.url)
          resolve()
        })
      })
    })
  })

})

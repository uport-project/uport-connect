import { expect, assert } from 'chai'
import { Connect } from './uport-connect'
import { Credentials } from 'uport'
import { openQr, closeQr } from '../src/util/qrdisplay'

describe('Connect', () => {
  describe('config', () => {
    it('defaults', () => {
      const uport = new Connect('test app')
      expect(uport.appName).to.equal('test app')
      expect(uport.infuraApiKey).to.equal('test-app')
      expect(uport.uriHandler.name).to.equal('openQr')
      expect(uport.network.id).to.equal('0x3')
      expect(uport.closeUriHandler.name).to.equal('closeQr')
      expect(uport.credentials).to.be.an.instanceof(Credentials)
      expect(uport.canSign).to.be.false
      expect(uport.getWeb3).to.be
    })

    it('does not have a closeUriHandler if not using built in openQr', () => {
      const noop = (uri) => null
      const uport = new Connect('test', {uriHandler: noop})
      expect(uport.uriHandler).to.equal(noop)
      expect(uport.closeUriHandler, 'uport.closeUriHandler').to.be.undefined
    })
  })
})

import { expect, assert } from 'chai'
import { Connect } from './uport-connect'
import { Credentials } from 'uport'
import { openQr, closeQr } from '../src/util/qrdisplay'
const sinon = require('sinon')

const mockTopic = (response) => {
  const topic = new Promise((resolve, reject) => resolve(response))
  topic.url = 'https://chasqui.uport.me/api/v1/topic/123'
  return topic
}

const errorTopic = () => {
  const topic = new Promise((resolve, reject) => reject(new Error('It broke')))
  topic.url = 'https://chasqui.uport.me/api/v1/topic/123'
  return topic
}

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

  describe('request', () => {
    const uri = 'me.uport:me'

    it('defaults to the given preset closeUriHandler', () => {
      const uriHandler = sinon.spy(), closeUriHandler = sinon.spy()
      const uport = new Connect('UportTests', {uriHandler, closeUriHandler})
      return uport.request({topic: mockTopic(), uri}).then(response => {
        expect(closeUriHandler.called, 'closeUriHandler called').to.be.true
      }, error => {
        throw new Error('uport.request Promise rejected, expected it to resolve')
      })
    })

    it('remembers to close if there is an error on the topic', () => {
      // Check that is calls closeUriHandler
      const uriHandler = sinon.spy(), closeUriHandler = sinon.spy()
      const uport = new Connect('UportTests', { uriHandler, closeUriHandler })
      return uport.request({topic: errorTopic(), uri}).then(response => {
        throw new Error('uport.request Promise resolved, expected it to reject')
      }, error => {
        expect(uriHandler.called, 'uriHandler called').to.be.true
        expect(closeUriHandler.called, 'closeUriHandler called').to.be.true
      })
    })
  })
})

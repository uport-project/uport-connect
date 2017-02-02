import { expect, assert } from 'chai'
import { Uport } from '../src/uport'

const JWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL0lySGVsNTA0MmlwWlk3Q04iLCJ0eXBlIjoic2hhcmVSZXNwIiwiaXNzIjoiMHg4MTkzMjBjZTJmNzI3NjgwNTRhYzAxMjQ4NzM0YzdkNGY5OTI5ZjZjIiwiaWF0IjoxNDgyNDI2MjEzMTk0LCJleHAiOjE0ODI1MTI2MTMxOTR9.WDVC7Rl9lyeGzoNyxbJ7SRAyTIqLKu2bmYvO5I0DmEs5XWVGKsn16B9o6Zp0O5huX7StRRY3ujDoI1ofFoRf2A'

describe('Uport', () => {
  describe('request', () => {
    const uri = 'me.uport:me'
    it('defaults to the preset showHandler', (done) => {
      const uport = new Uport('Integration Tests', {
        showHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          done()
        }
      })
      uport.request({uri})
    })

    it('can be overriden by a passed in showHandler', (done) => {
      const uport = new Uport('Integration Tests', {
        showHandler: (_uri) => assert.fail()
      })
      uport.request({
        uri,
        showHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          done()
        }
      })
    })
    // TODO figure out how to test isMobile
  })

  describe('connect', () => {
    it('returns address', (done) => {
      const uport = new Uport('Integration Tests', {
        topicFactory: (name) => {
          expect(name).to.equal('access_token')
          const topic = new Promise((resolve, reject) => resolve(JWT))
          topic.url = 'https://chasqui.uport.me/sample'
          return topic
        },
        showHandler: (uri) => {
          expect(uri).to.equal('me.uport:me?callback_url=https://chasqui.uport.me/sample')
        }
      })
      uport.connect().then(address => {
        expect(address).to.equal('0x819320ce2f72768054ac01248734c7d4f9929f6c')
        done()
      })
    })
  })
})

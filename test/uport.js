import { expect, assert } from 'chai'
import { Uport } from '../src/uport'
import { openQr, closeQr } from '../src/util/qrdisplay'

const JWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL0lySGVsNTA0MmlwWlk3Q04iLCJ0eXBlIjoic2hhcmVSZXNwIiwiaXNzIjoiMHg4MTkzMjBjZTJmNzI3NjgwNTRhYzAxMjQ4NzM0YzdkNGY5OTI5ZjZjIiwiaWF0IjoxNDgyNDI2MjEzMTk0LCJleHAiOjE0ODI1MTI2MTMxOTR9.WDVC7Rl9lyeGzoNyxbJ7SRAyTIqLKu2bmYvO5I0DmEs5XWVGKsn16B9o6Zp0O5huX7StRRY3ujDoI1ofFoRf2A'
const UPORT_ID = '0x819320ce2f72768054ac01248734c7d4f9929f6c'

const mockTopic = (response = UPORT_ID) => {
  const topic = new Promise((resolve, reject) => resolve(response))
  topic.url = 'https://chasqui.uport.me/api/v1/topic/123'
  return topic
}

const errorTopic = () => {
  const topic = new Promise((resolve, reject) => reject(new Error('It broke')))
  topic.url = 'https://chasqui.uport.me/api/v1/topic/123'
  return topic
}

describe('Uport', ()=> {
  describe('config', () => {
    it('defaults', () => {
      const uport = new Uport('test app')
      expect(uport.appName).to.equal('test app')
      expect(uport.infuraApiKey).to.equal('test-app')
      expect(uport.rpcUrl).to.equal('https://ropsten.infura.io/test-app')
      expect(uport.uriHandler).to.equal(openQr)
      expect(uport.closeUriHandler).to.equal(closeQr)
    })

    it('does not have a closeUriHandler if not using built in openQr', () => {
      const noop = (uri) => null
      const uport = new Uport('test', {uriHandler: noop})
      expect(uport.uriHandler).to.equal(noop)
      expect(uport.closeUriHandler).to.be.undefined
    })
  })

  describe('request', () => {
    const uri = 'me.uport:me'

    it('defaults to the preset uriHandler', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        uriHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        },
        closeUriHandler: () => { closed = true }
      })
      uport.request({topic: mockTopic(), uri}).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)
        done()
      }, error => {
        assert.fail()
        done()
      })
    })

    it('works fine without a closeUriHandler', (done) => {
      let opened
      const uport = new Uport('UportTests', {
        uriHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        }
      })
      uport.request({topic: mockTopic(), uri}).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        done()
      }, error => {
        assert.fail()
        done()
      })
    })

    it('can be overriden by a passed in uriHandler', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        uriHandler: (_uri) => {
          assert.fail()
          done()
        },
        closeUriHandler: () => { closed = true }
      })
      uport.request({
        uri,
        topic: mockTopic(),
        uriHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        }
      }).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)
        done()
      }, error => {
        assert.fail()
        done()
      })
    })

    it('uses the preset mobileUriHandler', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        isMobile: true,
        mobileUriHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        },
        closeUriHandler: () => { closed = true }
      })
      uport.request({
        uri,
        topic: mockTopic()
      }).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)
        done()
      }, error => {
        assert.fail()
        done()
      })
    })

    it('uses the preset mobileUriHandler even if there is a local override', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        isMobile: true,
        mobileUriHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        },
        closeUriHandler: () => { closed = true }
      })
      uport.request({
        uri,
        topic: mockTopic(),
        uriHandler: (_uri) => { 
          assert.fail()
          done()
        }
      }).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)
        done()
      }, error => {
        assert.fail()
        done()
      })
    })

    it('remembers to close if there is an error on the topic', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        uriHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        },
        closeUriHandler: () => { closed = true }
      })
      uport.request({topic: errorTopic(), uri}).then(response => {
        assert.fail()
        done()
      }, error => {
        expect(error.message).to.equal('It broke')
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)        
        done()
      })
    })

  })

  describe('connect', () => {
    it('returns address', (done) => {
      const uport = new Uport('UportTests', {
        topicFactory: (name) => {
          expect(name).to.equal('access_token')
          return mockTopic(JWT)
        },
        uriHandler: (uri) => {
          expect(uri).to.equal('me.uport:me?callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123')
        },
        closeUriHandler: () => null
      })
      uport.connect().then(address => {
        expect(address).to.equal(UPORT_ID)
        done()
      })
    })
  })

  describe('sendTransaction', () => {
    it('shows simple value url', (done) => {
      const uport = new Uport('UportTests', {
        topicFactory: (name) => {
          expect(name).to.equal('tx')
          return mockTopic('FAKETX')
        },
        uriHandler: (uri) => {
          expect(uri).to.equal('me.uport:0x819320ce2f72768054ac01248734c7d4f9929f6c?value=255&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123')
        },
        closeUriHandler: () => null
      })
      uport.sendTransaction({to: UPORT_ID, value: '0xff'}).then(txhash => {
        expect(txhash).to.equal('FAKETX')
        done()
      })
    })

    it('shows simple url with function', (done) => {
      const uport = new Uport('UportTests', {
        topicFactory: (name) => {
          expect(name).to.equal('tx')
          return mockTopic('FAKETX')
        },
        uriHandler: (uri) => {
          // Note it intentionally leaves out data as function overrides it
          // gas is not included in uri
          expect(uri).to.equal('me.uport:0x819320ce2f72768054ac01248734c7d4f9929f6c?value=255&function=transfer(address%200x819320ce2f72768054ac01248734c7d4f9929f6c%2Cuint%2012312)&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123')
        },
        closeUriHandler: () => null
      })
      uport.sendTransaction({
        to: UPORT_ID,
        value: '0xff',
        data: 'abcdef01',
        gas: '0x4444',
        function: `transfer(address ${UPORT_ID},uint 12312)`
      }).then(txhash => {
        expect(txhash).to.equal('FAKETX')
        done()
      })
    })

    it('shows simple url with data', (done) => {
      const uport = new Uport('UportTests', {
        topicFactory: (name) => {
          expect(name).to.equal('tx')
          return mockTopic('FAKETX')
        },
        uriHandler: (uri) => {
          // gas is not included in uri
          expect(uri).to.equal('me.uport:0x819320ce2f72768054ac01248734c7d4f9929f6c?value=255&bytecode=abcdef01&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123')
        },
        closeUriHandler: () => null
      })
      uport.sendTransaction({
        to: UPORT_ID,
        value: '0xff',
        data: 'abcdef01',
        gas: '0x4444'
      }).then(txhash => {
        expect(txhash).to.equal('FAKETX')
        done()
      })
    })

    it('throws an error for contract transactions', (done) => {
      const uport = new Uport('UportTests', {
        uriHandler: (uri) => null,
        closeUriHandler: () => null
      })
      expect(
        () => uport.sendTransaction({
          value: '0xff',
          data: 'abcdef01',
          gas: '0x4444'
        })
      ).to.throw('Contract creation is not supported by uportProvider')
      done()
    })
  })
})

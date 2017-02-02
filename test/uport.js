import { expect, assert } from 'chai'
import { Uport } from '../src/uport'

const JWT = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJhdWQiOiJodHRwczovL2NoYXNxdWkudXBvcnQubWUvYXBpL3YxL3RvcGljL0lySGVsNTA0MmlwWlk3Q04iLCJ0eXBlIjoic2hhcmVSZXNwIiwiaXNzIjoiMHg4MTkzMjBjZTJmNzI3NjgwNTRhYzAxMjQ4NzM0YzdkNGY5OTI5ZjZjIiwiaWF0IjoxNDgyNDI2MjEzMTk0LCJleHAiOjE0ODI1MTI2MTMxOTR9.WDVC7Rl9lyeGzoNyxbJ7SRAyTIqLKu2bmYvO5I0DmEs5XWVGKsn16B9o6Zp0O5huX7StRRY3ujDoI1ofFoRf2A'
const UPORT_ID = '0x819320ce2f72768054ac01248734c7d4f9929f6c'

const mockTopic = (response = UPORT_ID) => {
  const topic = new Promise((resolve, reject) => resolve(response))
  topic.url = 'https://chasqui.uport.me/api/v1/topic/123'
  return topic
}

describe('Uport', () => {
  describe('request', () => {
    const uri = 'me.uport:me'
    
    it('defaults to the preset showHandler', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        showHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        },
        closeHandler: () => { closed = true }
      })
      uport.request({topic: mockTopic(), uri}).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)
        done()
      }, error => {
        console.log(error)
        done()
      })
    })

    it('can be overriden by a passed in showHandler', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        showHandler: (_uri) => {
          assert.fail()
          done()
        },
        closeHandler: () => { closed = true }
      })
      uport.request({
        uri,
        topic: mockTopic(),
        showHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        }
      }).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)
        done()
      }, error => {
        console.log(error)
        done()
      })
    })

    it('uses the preset mobileShowHandler', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        isMobile: true,
        mobileShowHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        },
        closeHandler: () => { closed = true }
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
        console.log(error)
        done()
      })
    })

    it('uses the preset mobileShowHandler even if there is a local override', (done) => {
      let opened, closed
      const uport = new Uport('UportTests', {
        isMobile: true,
        mobileShowHandler: (_uri) => {
          expect(_uri).to.equal(uri)
          opened = true
        },
        closeHandler: () => { closed = true }
      })
      uport.request({
        uri,
        topic: mockTopic(),
        showHandler: (_uri) => { 
          assert.fail()
          done()
        }
      }).then(response => {
        expect(response).to.equal(UPORT_ID)
        expect(opened).to.equal(true)
        expect(closed).to.equal(true)
        done()
      }, error => {
        console.log(error)
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
        showHandler: (uri) => {
          expect(uri).to.equal('me.uport:me?callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123')
        },
        closeHandler: () => null
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
        showHandler: (uri) => {
          expect(uri).to.equal('me.uport:0x819320ce2f72768054ac01248734c7d4f9929f6c?value=255&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123')
        },
        closeHandler: () => null
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
        showHandler: (uri) => {
          expect(uri).to.equal('me.uport:0x819320ce2f72768054ac01248734c7d4f9929f6c?value=255&function=transfer(address%200x819320ce2f72768054ac01248734c7d4f9929f6c%2Cuint%2012312)&callback_url=https%3A%2F%2Fchasqui.uport.me%2Fapi%2Fv1%2Ftopic%2F123')
        },
        closeHandler: () => null
      })
      uport.sendTransaction({
        to: UPORT_ID,
        value: '0xff',
        function: `transfer(address ${UPORT_ID},uint 12312)`
      }).then(txhash => {
        expect(txhash).to.equal('FAKETX')
        done()
      })
    })

  })

})

import { assert } from 'chai'
import request from 'request'
import nets from 'nets'
import MsgServer from '../lib/msgServer.js'

const chasquiUrl = 'https://chasqui.uport.me/api/v1/topic/'
const testHref = 'http://not.real.url/'
let topic1
let topic2
let msgServer

describe('MsgServer', function () {
  this.timeout(10000)

  describe('On desktop', function () {

    before(function () { msgServer = new MsgServer(chasquiUrl, false) })

    it('Correctly polls for data', (done) => {
      let data = '0x123456789'
      const topic = msgServer.newTopic('access_token')
      topic.then((res) => {
        assert.equal(res, data, 'Should get correct data from server.')
        done()
      })
      setTimeout(
        () => postData(topic.url, 'access_token', data),
        3000
      )
    })

    it('Gives error if polling yields error', (done) => {
      const data = 'some weird error'
      const topic = msgServer.newTopic('tx')
      topic.catch(err => {
        assert.equal(err, data)
        done()
      })
      setTimeout(
        () => postData(topic.url, 'error', data),
        3000
      )
    })

    it('Has cleared topic', (done) => {
      const topic = msgServer.newTopic('access_token')
      topic.then((res) => {
        postData(topic.url, 'access_token', '0x234', (e, r, b) => {
          assert.equal(b.data.id, 'not found')
          done()
        })
      })
      setTimeout(
        () => postData(topic.url, 'access_token', '0x123'),
        3000
      )
    })
  })

  describe('On Mobile', () => {
    before(function () {
      msgServer = new MsgServer(chasquiUrl, true)
      // window.location.href = testHref
    })

    it('Correctly waits for data', (done) => {
      let data = '0x123456789'
      const topic = msgServer.newTopic('access_token')
      topic.then(res => {
        assert.equal(res, data, 'Should get correct data.')
        done()
      })
      global.window.location.hash = '#acess_token=' + data
      global.window.onhashchange()
    })

    it('Gives error if error posted', (done) => {
      let data = 'some weird error'
      const topic = msgServer.newTopic('access_token')
      topic.catch(err => {
        assert.equal(err, data)
        done()
      })
      global.window.location.hash = '#error=' + data
      global.window.onhashchange()
    })
  })
})

function postData (url, name, data, cb) {
  let body = {}
  body[name] = data
  if (!cb) cb = () => {}
  nets({
    url: url,
    method: 'POST',
    json: body
  }, cb)
}

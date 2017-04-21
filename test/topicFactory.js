import { assert } from 'chai'
import request from 'request'
import nets from 'nets'
import TopicFactory from '../src/topicFactory.js'

let topicFactory

describe('TopicFactory', function () {
  this.timeout(10000)

  describe('On desktop', function () {
    before(function () { topicFactory = TopicFactory(false, 500) })

    it('Correctly polls for data', (done) => {
      let data = '0x123456789'
      const topic = topicFactory('access_token')
      topic.then((res) => {
        assert.equal(res, data, 'Should get correct data from server.')
        done()
      }).catch(err => {
        assert.equal(err, null, 'Should not have error')
        done()
      })
      setTimeout(
        () => postData(topic.url, 'access_token', data),
        1000
      )
    })

    it('Gives error if polling yields error', (done) => {
      const data = 'some weird error'
      const topic = topicFactory('tx')
      topic.then(res => {
        assert.equal(res, null, 'Should not have data')
        done()
      }).catch(err => {
        assert.equal(err, data)
        done()
      })
      setTimeout(
        () => postData(topic.url, 'error', data),
        1000
      )
    })

    it('Has cleared topic', (done) => {
      const topic = topicFactory('access_token')
      topic.then((res) => {
        setTimeout(
          () => postData(topic.url, 'access_token', '0x234', (e, r, b) => {
            assert.equal(b.data.id, 'not found')
            done()
          }),
        500)
      })
      setTimeout(
        () => postData(topic.url, 'access_token', '0x123'),
        1000
      )
    })
  })

  describe('On Mobile', () => {
    before(function () {
      topicFactory = new TopicFactory(true)
    })

    it('Correctly waits for data', (done) => {
      let data = '0x123456789'
      const topic = topicFactory('access_token')
      topic.then(res => {
        assert.equal(res, data, 'Should get correct data.')
        done()
      })
      global.window.location.hash = '#access_token=' + data
      global.window.onhashchange()
    })

    it('Gives error if error posted', (done) => {
      let data = 'some weird error'
      const topic = topicFactory('access_token')
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
  const body = {}
  body[name] = data
  if (!cb) cb = () => {}
  nets({
    url: url,
    method: 'POST',
    json: body
  }, cb)
}

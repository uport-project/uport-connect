import nets from 'nets'
import qs from 'qs'
import randomString from '../utils/randomString'

class MsgServer {
  constructor (chasquiUrl, isOnMobile) {
    this.chasquiUrl = chasquiUrl
    this.intervalIds = {}
    this.isOnMobile = isOnMobile
  }
  newTopic (topicName) {
    let topic = {
      name: topicName,
      id: randomString(16)
    }
    if (this.isOnMobile) {
      topic.url = window.location.href
    } else {
      topic.url = this.chasquiUrl + topic.id
    }
    return topic
  }
  waitForResult (topic, cb) {
    if (this.isOnMobile) {
      this.waitForHashChange(topic, cb)
    } else {
      this.pollForResult(topic, cb)
    }
  }
  waitForHashChange (topic, cb) {
    window.onhashchange = function () {
      if (window.location.hash) {
        let params = qs.parse(window.location.hash.slice(1))
        if (params[topic.name]) {
          window.onhashchange = function () {}
          window.location.hash = ''
          cb(null, params[topic.name])
        } else if (params.error) {
          window.onhashchange = function () {}
          window.location.hash = ''
          cb(params.error)
        }
      }
    }
  }
  pollForResult (topic, cb) {
    const self = this

    self.intervalIds[topic.id] = setInterval(

      nets.bind(
        null,
        {
          uri: topic.url,
          method: 'GET',
          rejectUnauthorized: false
        },
        function (err, res, body) {
          if (err) return cb(err)

          // parse response into raw account
          let data
          try {
            data = JSON.parse(body).message
            if (data.error) {
              clearInterval(self.intervalIds[topic.id])
              return cb(data.error)
            }
          } catch (err) {
            console.error(err.stack)
            clearInterval(self.intervalIds[topic.id])
            return cb(err)
          }
          // Check for param, stop polling and callback if present
          if (data && data[topic.name]) {
            clearInterval(self.intervalIds[topic.id])
            self.intervalIds[topic.id] = null
            self.clearTopic(topic.url)
            return cb(null, data[topic.name])
          }
        }
      ), 2000)
  }
  clearTopic (url) {
    nets({
      uri: url,
      method: 'DELETE',
      rejectUnauthorized: false
    }, function (err) { if (err) { throw err } /* Errors withouth this cb */ })
  }
}

export default MsgServer

import nets from 'nets'
import qs from 'qs'
import randomString from './util/randomString'
const CHASQUI_URL = 'https://chasqui.uport.me/api/v1/topic/'

function TopicFactory (isOnMobile, pollingInterval = 2000, chasquiUrl = CHASQUI_URL) {
  function waitForHashChange (topicName, cb) {
    window.onhashchange = function () {
      if (window.location.hash) {
        const params = qs.parse(window.location.hash.slice(1))
        if (params[topicName]) {
          window.onhashchange = function () {}
          window.location.hash = ''
          cb(null, params[topicName])
        } else if (params.error) {
          window.onhashchange = function () {}
          window.location.hash = ''
          cb(params.error)
        }
      }
    }
  }

  function pollForResult (topicName, url, cb, cancelled) {
    let interval = setInterval(
      () => {
        nets({
          uri: url,
          json: true,
          method: 'GET',
          withCredentials: false,
          rejectUnauthorized: false
        },
        function (err, res, body) {
          if (err) return cb(err)

          if (cancelled()) {
            clearInterval(interval)
            return cb(new Error('Request Cancelled'))
          }

          // parse response into raw account
          const data = body.message
          try {
            if (data.error) {
              clearInterval(interval)
              return cb(data.error)
            }
          } catch (err) {
            console.error(err.stack)
            clearInterval(interval)
            return cb(err)
          }
          // Check for param, stop polling and callback if present
          if (data && data[topicName]) {
            clearInterval(interval)
            clearTopic(url)
            return cb(null, data[topicName])
          }
        })
      }, pollingInterval)
  }


  function clearTopic (url) {
    nets({
      uri: url,
      method: 'DELETE',
      withCredentials: false,
      rejectUnauthorized: false
    }, function (err) { if (err) { throw err } /* Errors withouth this cb */ })
  }

  function newTopic (topicName) {

    let isCancelled = false;

    let url
    if (isOnMobile) {
      url = window.location.href
    } else {
      url = chasquiUrl + randomString(16)
    }
    const topic = new Promise((resolve, reject) => {
      const cb = (error, response) => {
        if (error) return reject(error)
        resolve(response)
      }
      if (isOnMobile) {
        waitForHashChange(topicName, cb)
      } else {
        pollForResult(topicName, url, cb, () => isCancelled)
      }
    })
    topic.url = url
    topic.cancel = () => {isCancelled = true}
    return topic
  }

  return newTopic
}


export default TopicFactory
